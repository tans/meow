import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { surfaceIds } from "../../packages/contracts/index.js";
import { demoFinanceConfig } from "../../packages/domain-finance/index.js";
import {
  createApiDbContext,
  db as defaultDb,
  sqliteDb as defaultSqliteDb,
} from "./lib/db.js";

const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;
const VALID_CLIENTS = new Set(["web", "miniapp", "admin"]);
const VALID_ROLES = new Set(["creator", "merchant", "operator"]);
const currentDir = fileURLToPath(new URL(".", import.meta.url));

class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function errorResponse(error) {
  if (error instanceof AppError) {
    return json({ error: error.message, status: error.status }, error.status);
  }

  console.error("[api] unhandled error:", error);
  return json(
    { error: "An unexpected error occurred", status: 500 },
    500
  );
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    (cookieHeader ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator < 0) {
          return [part, ""];
        }
        return [part.slice(0, separator), part.slice(separator + 1)];
      })
  );
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`];
  parts.push(`Path=${options.path ?? "/"}`);
  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }
  parts.push(`SameSite=${options.sameSite ?? "Lax"}`);
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function compilePath(pathname) {
  const keys = [];
  const source = pathname
    .replace(/\/+$/, "")
    .replace(/:[^/]+/g, (token) => {
      keys.push(token.slice(1));
      return "([^/]+)";
    });

  return {
    keys,
    regex: new RegExp(`^${source || "/"}$`),
  };
}

function createRouter() {
  const routes = [];

  const register = (method, pathname, handler) => {
    routes.push({
      method,
      pathname,
      ...compilePath(pathname),
      handler,
    });
  };

  const app = {
    get(pathname, handler) {
      register("GET", pathname, handler);
      return app;
    },
    post(pathname, handler) {
      register("POST", pathname, handler);
      return app;
    },
    patch(pathname, handler) {
      register("PATCH", pathname, handler);
      return app;
    },
    put(pathname, handler) {
      register("PUT", pathname, handler);
      return app;
    },
    async handle(request) {
      const url = new URL(request.url);
      const pathname = url.pathname.replace(/\/+$/, "") || "/";

      try {
        for (const route of routes) {
          if (route.method !== request.method) {
            continue;
          }

          const match = route.regex.exec(pathname);
          if (!match) {
            continue;
          }

          const params = Object.fromEntries(
            route.keys.map((key, index) => [key, decodeURIComponent(match[index + 1])])
          );

          return await route.handler({
            request,
            url,
            params,
            query: url.searchParams,
          });
        }

        return json({ error: "Route not found", status: 404 }, 404);
      } catch (error) {
        return errorResponse(error);
      }
    },
    fetch(request) {
      return app.handle(request);
    },
    request(input, init) {
      if (input instanceof Request) {
        return app.handle(input);
      }

      return app.handle(
        new Request(new URL(input, "http://localhost"), init)
      );
    },
  };

  return app;
}

function coercePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, "invalid pagination");
  }

  return parsed;
}

async function readJson(request, invalidMessage) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("invalid");
    }
    return body;
  } catch {
    throw new AppError(400, invalidMessage);
  }
}

async function maybeReadJson(request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {};
  }

  return readJson(request, "invalid merchant task input");
}

function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total: items.length,
    },
  };
}

function defaultUploadDir() {
  return process.env.MEOW_UPLOAD_DIR ?? join(currentDir, "uploads");
}

function createUploadStore(uploadDir) {
  const mimeTypeByExtension = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
  };

  const extensionByMimeType = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm",
  };

  const inferKind = (mimeType) => {
    if (mimeType.startsWith("image/")) {
      return "image";
    }
    if (mimeType.startsWith("video/")) {
      return "video";
    }
    throw new AppError(400, "unsupported upload type");
  };

  const inferExtension = (fileName, mimeType) => {
    const currentExtension = extname(fileName).toLowerCase();
    return currentExtension || extensionByMimeType[mimeType] || "";
  };

  return {
    async save(files) {
      if (files.length === 0) {
        throw new AppError(400, "missing upload files");
      }

      await mkdir(uploadDir, { recursive: true });

      return Promise.all(
        files.map(async (file) => {
          if (file.size > MAX_UPLOAD_FILE_BYTES) {
            throw new AppError(413, "upload file too large");
          }

          const mimeType = file.type || "application/octet-stream";
          const kind = inferKind(mimeType);
          const id = randomUUID();
          const extension = inferExtension(file.name, mimeType);
          const storageName = `${id}${extension}`;
          const filePath = join(uploadDir, storageName);
          const bytes = new Uint8Array(await file.arrayBuffer());

          await writeFile(filePath, bytes);

          return {
            id,
            kind,
            url: `/merchant/uploads/${storageName}`,
            fileName: file.name || storageName,
            mimeType,
          };
        })
      );
    },
    async read(storageName) {
      const safeName = basename(storageName);
      const filePath = join(uploadDir, safeName);
      const body = await readFile(filePath);
      return {
        body,
        mimeType:
          mimeTypeByExtension[extname(safeName).toLowerCase()] ??
          "application/octet-stream",
      };
    },
  };
}

function calculateLockedAmount(task) {
  return (task.baseAmount ?? 1) * (task.baseCount ?? 1) + (task.rankingTotal ?? 2);
}

function createLedgerEntriesForPublish(taskId, lockedAmount) {
  return [
    {
      taskId,
      account: "merchant_balance",
      amount: lockedAmount,
      direction: "debit",
      note: "task_publish_lock",
    },
    {
      taskId,
      account: "merchant_escrow",
      amount: lockedAmount,
      direction: "credit",
      note: "task_publish_lock",
    },
  ];
}

function createMirrorEntries(taskId, amount, debitAccount, creditAccount, note, submissionId) {
  return [
    {
      taskId,
      submissionId,
      account: debitAccount,
      amount,
      direction: "debit",
      note,
    },
    {
      taskId,
      submissionId,
      account: creditAccount,
      amount,
      direction: "credit",
      note,
    },
  ];
}

export function createApiApp(options = {}) {
  const usingDefaultContext = !options.dbContext && !options.dbPath && options.seedDemo === undefined;
  const dbContext = options.dbContext ?? (
    usingDefaultContext
      ? { db: defaultDb, sqliteDb: defaultSqliteDb }
      : createApiDbContext({
          dbPath: options.dbPath,
          seedDemo: options.seedDemo,
        })
  );
  const repository = dbContext.db;
  const sqliteDb = dbContext.sqliteDb;
  const buildTime = options.buildTime ?? new Date().toISOString();
  const packageVersion =
    options.packageVersion ?? process.env.npm_package_version ?? "0.1.0";
  const uploadStore = createUploadStore(options.uploadDir ?? defaultUploadDir());
  const app = createRouter();
  const startTime = Date.now();
  const adminSettings = {
    allowTaskPublish: true,
    enableTipReward: true,
    dailyTaskRewardCap: 100,
  };
  let nextSubmissionId = 1;

  const isDemoAuthEnabled = () =>
    options.demoAuthEnabled ??
    (
      process.env.MEOW_DEMO_AUTH === "true" ||
      process.env.MEOW_AUTH_MODE === "demo"
    );

  const shouldSetSecureCookie = () =>
    options.cookieSecure ?? (process.env.MEOW_COOKIE_SECURE === "true");

  const getSession = (request) => {
    const cookies = parseCookies(request.headers.get("cookie"));
    const sessionId = cookies.meow_session;

    if (!sessionId) {
      throw new AppError(401, "missing session");
    }

    const session = repository.findSession(sessionId);
    if (!session) {
      throw new AppError(401, "invalid session");
    }

    const user = repository.getUser(session.userId);
    if (!user || !user.roles.includes(session.activeRole)) {
      throw new AppError(401, "invalid session");
    }

    return {
      sessionId: session.id,
      userId: user.id,
      activeRole: session.activeRole,
      roles: user.roles,
      user,
    };
  };

  const requireRole = (request, role) => {
    const session = getSession(request);
    if (session.activeRole !== role) {
      throw new AppError(403, `${role} access denied`);
    }
    return session;
  };

  const toSubmissionReadModel = (submission) => ({
    id: submission.id,
    taskId: submission.taskId,
    creatorId: submission.creatorId,
    status: submission.status,
    rewardTags: [
      ...new Set(
        repository.listRewardsBySubmission(submission.id).map((reward) => reward.type)
      ),
    ],
  });

  const toCreatorSubmission = (submission) => ({
    ...toSubmissionReadModel(submission),
    assetUrl: submission.assetUrl,
    description: submission.description,
  });

  const getMerchantOwnedTask = (merchantId, taskId) => {
    const task = repository.getTask(taskId);
    if (!task) {
      throw new AppError(404, "task not found");
    }
    if (task.merchantId !== merchantId) {
      throw new AppError(403, "merchant does not own task");
    }
    return task;
  };

  const getMerchantOwnedSubmission = (merchantId, submissionId) => {
    const submission = repository.getSubmission(submissionId);
    if (!submission) {
      throw new AppError(404, "submission not found");
    }

    const task = getMerchantOwnedTask(merchantId, submission.taskId);
    return { task, submission };
  };

  const getCreatorOwnedSubmission = (creatorId, submissionId) => {
    const submission = repository.getSubmission(submissionId);
    if (!submission) {
      throw new AppError(404, "submission not found");
    }
    if (submission.creatorId !== creatorId) {
      throw new AppError(403, "creator does not own submission");
    }
    return submission;
  };

  const getCreatorWalletSnapshot = (creatorId) => {
    const rewards = repository.listRewardsByCreator(creatorId);
    return {
      creatorId,
      frozenAmount: rewards
        .filter((reward) => reward.status === "frozen")
        .reduce((total, reward) => total + reward.amount, 0),
      availableAmount: rewards
        .filter((reward) => reward.status === "available")
        .reduce((total, reward) => total + reward.amount, 0),
      submissionCount: repository.listSubmissionsByCreator(creatorId).length,
    };
  };

  const getMerchantWalletSnapshot = (merchantId) => {
    const activeTasks = repository
      .listTasks()
      .filter((task) => task.merchantId === merchantId && task.status !== "draft");
    const escrowAmount = activeTasks.reduce((total, task) => {
      if (task.status === "settled") {
        return total;
      }
      return total + task.escrowLockedAmount;
    }, 0);
    const reservedEscrowAmount = activeTasks.reduce((total, task) => {
      if (task.status === "settled") {
        return total;
      }
      const rewardAmount = repository
        .listRewardsByTask(task.id)
        .filter((reward) => reward.type === "base" || reward.type === "ranking")
        .filter((reward) => reward.status !== "cancelled")
        .reduce((sum, reward) => sum + reward.amount, 0);
      return total + rewardAmount;
    }, 0);
    const tipSpentAmount = repository
      .listTasks()
      .filter((task) => task.merchantId === merchantId)
      .reduce((total, task) => {
        const tips = repository
          .listRewardsByTask(task.id)
          .filter((reward) => reward.type === "tip")
          .reduce((sum, reward) => sum + reward.amount, 0);
        return total + tips;
      }, 0);

    return {
      merchantId,
      escrowAmount,
      refundableAmount: Math.max(escrowAmount - reservedEscrowAmount, 0),
      tipSpentAmount,
      publishedTaskCount: activeTasks.length,
    };
  };

  app.get("/health", () => {
    sqliteDb.exec("SELECT 1");

    return json({
      ok: true,
      service: "meow-api",
      surfaces: surfaceIds,
      uptime: `${Math.round((Date.now() - startTime) / 1000)}s`,
      db: "ok",
    });
  });

  app.get("/version", () =>
    json({
      buildTime,
      packageVersion,
    })
  );

  app.get("/stats", () => {
    const publishedTasks = repository
      .listTasks()
      .filter((task) => task.status === "published").length;
    const submissions = repository
      .listTasks()
      .reduce((total, task) => total + repository.listSubmissionsByTask(task.id).length, 0);
    const creators = repository
      .listUsers()
      .filter((user) => user.roles.includes("creator")).length;

    return json({
      publishedTasks,
      submissions,
      creators,
    });
  });

  app.get("/__tests__/error-response/unhandled", () => {
    throw new Error("sensitive stack detail");
  });

  app.post("/auth/login", async ({ request }) => {
    const body = await readJson(request, "invalid auth input");

    if (!isDemoAuthEnabled()) {
      throw new AppError(403, "demo auth disabled");
    }

    if (
      typeof body.identifier !== "string" ||
      body.identifier.trim() === "" ||
      typeof body.secret !== "string" ||
      body.secret.trim() === "" ||
      typeof body.client !== "string" ||
      !VALID_CLIENTS.has(body.client)
    ) {
      throw new AppError(400, "invalid login input");
    }

    if (body.secret !== "demo-pass") {
      throw new AppError(401, "invalid credentials");
    }

    const user = repository.findUserByIdentifier(body.identifier.trim());
    if (!user) {
      throw new AppError(401, "invalid credentials");
    }

    const activeRole = user.roles.includes("creator") ? "creator" : user.roles[0];
    const session = repository.createSession({
      userId: user.id,
      activeRole,
      client: body.client,
    });

    return json(
      {
        sessionId: session.id,
        userId: session.userId,
        activeRole: session.activeRole,
        roles: user.roles,
        user: {
          id: user.id,
          displayName: user.displayName,
        },
      },
      200,
      {
        "set-cookie": serializeCookie("meow_session", session.id, {
          maxAge: 60 * 60 * 24 * 7,
          secure: shouldSetSecureCookie(),
        }),
      }
    );
  });

  app.get("/auth/session", ({ request }) => {
    const session = getSession(request);

    return json({
      sessionId: session.sessionId,
      userId: session.userId,
      activeRole: session.activeRole,
      roles: session.roles,
    });
  });

  app.post("/auth/switch-role", async ({ request }) => {
    const session = getSession(request);
    const body = await readJson(request, "invalid auth input");

    if (typeof body.role !== "string" || !VALID_ROLES.has(body.role)) {
      throw new AppError(400, "invalid role input");
    }

    if (!session.roles.includes(body.role)) {
      throw new AppError(403, "role access denied");
    }

    const next = repository.switchSessionRole(session.sessionId, body.role);
    return json({
      sessionId: next.id,
      userId: next.userId,
      activeRole: next.activeRole,
      roles: session.roles,
    });
  });

  app.get("/creator/tasks", ({ request }) => {
    requireRole(request, "creator");

    return json(
      repository
        .listTasks()
        .filter((task) => task.status === "published")
        .map((task) => ({
          id: task.id,
          merchantId: task.merchantId,
          status: task.status,
          title: task.title,
          rewardAmount: task.escrowLockedAmount,
        }))
    );
  });

  app.get("/creator/tasks/:taskId", ({ request, params }) => {
    const session = requireRole(request, "creator");
    const task = repository.getTask(params.taskId);
    if (!task) {
      throw new AppError(404, "task not found");
    }
    if (task.status === "draft") {
      throw new AppError(403, "task is not available");
    }

    return json({
      id: task.id,
      merchantId: task.merchantId,
      status: task.status,
      creatorSubmissionCount: repository
        .listSubmissionsByTask(task.id)
        .filter((submission) => submission.creatorId === session.userId).length,
    });
  });

  app.get("/creator/tasks/:taskId/submissions", ({ request, params }) => {
    const session = requireRole(request, "creator");
    const task = repository.getTask(params.taskId);
    if (!task) {
      throw new AppError(404, "task not found");
    }
    if (task.status === "draft") {
      throw new AppError(403, "task is not available");
    }

    return json(
      repository
        .listSubmissionsByTask(task.id)
        .filter((submission) => submission.creatorId === session.userId)
        .map(toCreatorSubmission)
    );
  });

  app.post("/creator/tasks/:taskId/submissions", async ({ request, params }) => {
    const session = requireRole(request, "creator");
    const task = repository.getTask(params.taskId);
    if (!task) {
      throw new AppError(404, "task not found");
    }
    if (task.status !== "published") {
      throw new AppError(403, "task is not published");
    }

    const body = await readJson(request, "invalid submission json");
    if (
      typeof body.assetUrl !== "string" ||
      body.assetUrl.trim() === "" ||
      typeof body.description !== "string" ||
      body.description.trim() === ""
    ) {
      throw new AppError(400, "invalid submission input");
    }

    const submission = repository.saveSubmission({
      id: `submission-${nextSubmissionId++}`,
      taskId: task.id,
      creatorId: session.userId,
      assetUrl: body.assetUrl.trim(),
      description: body.description.trim(),
      status: "submitted",
    });

    return json(submission, 201);
  });

  app.get("/creator/submissions", ({ request, query }) => {
    const session = requireRole(request, "creator");
    const page = coercePositiveInteger(query.get("page"), 1);
    const pageSize = coercePositiveInteger(query.get("pageSize"), 20);
    if (pageSize > 100) {
      throw new AppError(400, "invalid pagination");
    }

    return json(
      paginate(
        repository.listSubmissionsByCreator(session.userId).map(toCreatorSubmission),
        page,
        pageSize
      )
    );
  });

  app.patch("/creator/submissions/:submissionId", async ({ request, params }) => {
    const session = requireRole(request, "creator");
    const submission = getCreatorOwnedSubmission(session.userId, params.submissionId);
    if (submission.status !== "submitted") {
      throw new AppError(403, "submission is not editable");
    }

    const body = await readJson(request, "invalid submission json");
    const assetUrl =
      typeof body.assetUrl === "string" ? body.assetUrl.trim() : submission.assetUrl;
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : submission.description;

    if (!assetUrl || !description) {
      throw new AppError(400, "invalid submission input");
    }

    return json(
      repository.saveSubmission({
        ...submission,
        assetUrl,
        description,
      })
    );
  });

  app.post("/creator/submissions/:submissionId/withdraw", ({ request, params }) => {
    const session = requireRole(request, "creator");
    const submission = getCreatorOwnedSubmission(session.userId, params.submissionId);
    if (submission.status !== "submitted") {
      throw new AppError(403, "submission cannot be withdrawn");
    }

    repository.saveSubmission({
      ...submission,
      status: "withdrawn",
    });

    return json({
      submissionId: submission.id,
      status: "withdrawn",
    });
  });

  app.get("/creator/wallet", ({ request }) => {
    const session = requireRole(request, "creator");
    return json(getCreatorWalletSnapshot(session.userId));
  });

  app.post("/merchant/tasks", async ({ request }) => {
    const session = requireRole(request, "merchant");
    const body = await maybeReadJson(request);
    const task = repository.createTaskDraft(session.userId, {
      title:
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : undefined,
      baseAmount:
        typeof body.baseAmount === "number" && body.baseAmount > 0
          ? body.baseAmount
          : 1,
      baseCount:
        typeof body.baseCount === "number" && body.baseCount > 0
          ? body.baseCount
          : 2,
      rankingTotal:
        typeof body.rankingTotal === "number" && body.rankingTotal >= 0
          ? body.rankingTotal
          : 2,
      assetAttachments: Array.isArray(body.assetAttachments)
        ? body.assetAttachments
        : [],
    });

    return json(
      {
        taskId: task.id,
        status: task.status,
      },
      201
    );
  });

  app.get("/merchant/tasks", ({ request, query }) => {
    const session = requireRole(request, "merchant");
    const tasks = repository
      .listTasks()
      .filter((task) => task.merchantId === session.userId)
      .map((task) => ({
        id: task.id,
        merchantId: task.merchantId,
        title: task.title,
        status: task.status,
        baseAmount: task.baseAmount,
        baseCount: task.baseCount,
        rankingTotal: task.rankingTotal,
        escrowLockedAmount: task.escrowLockedAmount,
        submissionCount: repository.listSubmissionsByTask(task.id).length,
        assetAttachments: task.assetAttachments,
      }));

    if (!query.get("page") && !query.get("pageSize")) {
      return json(tasks);
    }

    const page = coercePositiveInteger(query.get("page"), 1);
    const pageSize = coercePositiveInteger(query.get("pageSize"), 20);
    if (pageSize > 100) {
      throw new AppError(400, "invalid pagination");
    }

    return json(paginate(tasks, page, pageSize));
  });

  app.get("/merchant/tasks/:taskId", ({ request, params }) => {
    const session = requireRole(request, "merchant");
    const task = getMerchantOwnedTask(session.userId, params.taskId);

    return json({
      id: task.id,
      merchantId: task.merchantId,
      title: task.title,
      status: task.status,
      baseAmount: task.baseAmount,
      baseCount: task.baseCount,
      rankingTotal: task.rankingTotal,
      escrowLockedAmount: task.escrowLockedAmount,
      submissionCount: repository.listSubmissionsByTask(task.id).length,
      rewardTags: [
        ...new Set(
          repository.listRewardsByTask(task.id).map((reward) => reward.type)
        ),
      ],
      assetAttachments: task.assetAttachments,
    });
  });

  app.post("/merchant/tasks/:taskId/publish", ({ request, params }) => {
    const session = requireRole(request, "merchant");
    const task = getMerchantOwnedTask(session.userId, params.taskId);

    if (!adminSettings.allowTaskPublish) {
      throw new AppError(403, "task publishing disabled");
    }
    if (task.status !== "draft") {
      throw new AppError(403, "task cannot be published");
    }

    const lockedAmount = calculateLockedAmount(task);
    repository.saveTask({
      ...task,
      status: "published",
      escrowLockedAmount: lockedAmount,
    });
    repository.appendLedgerEntries(
      createLedgerEntriesForPublish(task.id, lockedAmount)
    );

    return json({
      id: task.id,
      merchantId: task.merchantId,
      status: "published",
      ledgerEffect: "merchant_escrow_locked",
    });
  });

  app.get("/merchant/tasks/:taskId/submissions", ({ request, params }) => {
    const session = requireRole(request, "merchant");
    getMerchantOwnedTask(session.userId, params.taskId);

    return json(
      repository.listSubmissionsByTask(params.taskId).map(toSubmissionReadModel)
    );
  });

  app.get("/merchant/wallet", ({ request }) => {
    const session = requireRole(request, "merchant");
    return json(getMerchantWalletSnapshot(session.userId));
  });

  app.post("/merchant/uploads", async ({ request }) => {
    requireRole(request, "merchant");

    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_UPLOAD_FILE_BYTES
    ) {
      throw new AppError(413, "upload request too large");
    }

    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value) => value instanceof File);

    const attachments = await uploadStore.save(files);
    return json({ attachments }, 201);
  });

  app.get("/merchant/uploads/:name", async ({ params }) => {
    const file = await uploadStore.read(params.name);
    return new Response(file.body, {
      status: 200,
      headers: {
        "content-type": file.mimeType,
      },
    });
  });

  app.post("/merchant/submissions/:submissionId/review", async ({ request, params }) => {
    const session = requireRole(request, "merchant");
    const { submission } = getMerchantOwnedSubmission(session.userId, params.submissionId);
    if (submission.status === "withdrawn") {
      throw new AppError(403, "submission is withdrawn");
    }

    const body = await readJson(request, "invalid merchant review input");
    const approved =
      typeof body.approved === "boolean"
        ? body.approved
        : body.decision === "approved";
    const rejected =
      body.decision === "rejected" ||
      (typeof body.approved === "boolean" && body.approved === false);

    if (!approved && !rejected) {
      throw new AppError(400, "invalid merchant review input");
    }

    if (rejected) {
      repository.saveSubmission({
        ...submission,
        status: "rejected",
        reviewReason:
          typeof body.reason === "string" && body.reason.trim()
            ? body.reason.trim()
            : "merchant_rejected",
      });

      const baseReward = repository.findRewardBySubmissionAndType(
        submission.id,
        "base"
      );
      if (baseReward) {
        repository.saveReward({
          ...baseReward,
          status: "cancelled",
        });
      }

      return json({
        submissionId: submission.id,
        status: "rejected",
        rewardType: baseReward ? "base" : undefined,
        rewardStatus: baseReward ? "cancelled" : undefined,
      });
    }

    repository.saveSubmission({
      ...submission,
      status: "approved",
      reviewReason: undefined,
    });

    const reward =
      repository.findRewardBySubmissionAndType(submission.id, "base") ??
      repository.createReward({
        taskId: submission.taskId,
        submissionId: submission.id,
        creatorId: submission.creatorId,
        type: "base",
        amount: demoFinanceConfig.baseRewardAmount,
        status: "frozen",
      });

    return json({
      submissionId: submission.id,
      status: "approved",
      rewardType: reward.type,
      rewardStatus: reward.status,
    });
  });

  app.post("/merchant/submissions/:submissionId/tips", async ({ request, params }) => {
    const session = requireRole(request, "merchant");
    const { task, submission } = getMerchantOwnedSubmission(
      session.userId,
      params.submissionId
    );
    if (submission.status === "withdrawn") {
      throw new AppError(403, "submission is withdrawn");
    }
    if (!adminSettings.enableTipReward) {
      throw new AppError(403, "tip reward disabled");
    }

    const body = request.headers.get("content-type")?.includes("application/json")
      ? await readJson(request, "invalid merchant tip input")
      : {};
    const amount =
      typeof body.amount === "number" && body.amount > 0
        ? body.amount
        : demoFinanceConfig.tipRewardAmount;

    const reward = repository.createReward({
      taskId: task.id,
      submissionId: submission.id,
      creatorId: submission.creatorId,
      type: "tip",
      amount,
      status: "frozen",
    });

    repository.appendLedgerEntries(
      createMirrorEntries(
        task.id,
        reward.amount,
        "merchant_balance",
        "creator_frozen",
        "tip_reward_frozen",
        submission.id
      )
    );

    return json(
      {
        submissionId: submission.id,
        taskId: task.id,
        rewardType: reward.type,
        rewardStatus: reward.status,
        amount: reward.amount,
      },
      201
    );
  });

  app.post("/merchant/tasks/:taskId/rewards/ranking", async ({ request, params }) => {
    const session = requireRole(request, "merchant");
    const task = getMerchantOwnedTask(session.userId, params.taskId);
    const body = request.headers.get("content-type")?.includes("application/json")
      ? await readJson(request, "invalid merchant ranking input")
      : {};
    const submission = body.submissionId
      ? repository.getSubmission(body.submissionId)
      : repository
          .listSubmissionsByTask(task.id)
          .find((item) => item.status === "approved");

    if (!submission || submission.taskId !== task.id) {
      throw new AppError(404, "approved submission not found");
    }
    if (submission.status === "withdrawn") {
      throw new AppError(403, "submission is withdrawn");
    }
    if (submission.status !== "approved") {
      throw new AppError(403, "submission is not approved");
    }

    const amount =
      typeof body.amount === "number" && body.amount > 0
        ? body.amount
        : demoFinanceConfig.rankingRewardAmount;

    const reward =
      repository.findRewardBySubmissionAndType(submission.id, "ranking") ??
      repository.createReward({
        taskId: task.id,
        submissionId: submission.id,
        creatorId: submission.creatorId,
        type: "ranking",
        amount,
        status: "frozen",
      });

    return json(
      {
        submissionId: submission.id,
        taskId: task.id,
        rewardType: reward.type,
        rewardStatus: reward.status,
        amount: reward.amount,
      },
      201
    );
  });

  app.post("/merchant/tasks/:taskId/settle", ({ request, params }) => {
    const session = requireRole(request, "merchant");
    const task = getMerchantOwnedTask(session.userId, params.taskId);
    const rewards = repository
      .listRewardsByTask(task.id)
      .filter((reward) => reward.status === "frozen");
    const escrowRewardTotal = rewards
      .filter((reward) => reward.type === "base" || reward.type === "ranking")
      .reduce((total, reward) => total + reward.amount, 0);
    const totalFrozenRewardAmount = rewards.reduce(
      (total, reward) => total + reward.amount,
      0
    );
    const merchantRefundDelta = Math.max(
      calculateLockedAmount(task) - escrowRewardTotal,
      0
    );

    if (escrowRewardTotal > 0) {
      repository.appendLedgerEntries(
        createMirrorEntries(
          task.id,
          escrowRewardTotal,
          "merchant_escrow",
          "creator_frozen",
          "reward_release_to_frozen"
        )
      );
    }

    if (totalFrozenRewardAmount > 0) {
      repository.appendLedgerEntries(
        createMirrorEntries(
          task.id,
          totalFrozenRewardAmount,
          "creator_frozen",
          "creator_available",
          "reward_release_to_available"
        )
      );
    }

    if (merchantRefundDelta > 0) {
      repository.appendLedgerEntries(
        createMirrorEntries(
          task.id,
          merchantRefundDelta,
          "merchant_escrow",
          "merchant_balance",
          "unused_budget_refund"
        )
      );
    }

    for (const reward of rewards) {
      repository.saveReward({
        ...reward,
        status: "available",
      });
    }

    repository.saveTask({
      ...task,
      status: "settled",
    });

    return json({
      taskId: task.id,
      status: "settled",
      creatorAvailableDelta: totalFrozenRewardAmount,
      merchantRefundDelta,
    });
  });

  app.get("/admin/dashboard", ({ request }) => {
    requireRole(request, "operator");

    const tasks = repository.listTasks();
    const submissions = tasks.flatMap((task) =>
      repository.listSubmissionsByTask(task.id)
    );
    const frozenAmount = repository
      .listTasks()
      .flatMap((task) => repository.listRewardsByTask(task.id))
      .filter((reward) => reward.status === "frozen")
      .reduce((total, reward) => total + reward.amount, 0);
    const operatorActions = repository.listOperatorActions().slice(0, 3);
    const pausedTasks = tasks.filter((task) => task.status === "paused").length;
    const bannedUsers = repository
      .listUsers()
      .filter((user) => user.state === "banned").length;

    return json({
      activeTasks: tasks.filter((task) => task.status === "published").length,
      submissionsToday: submissions.length,
      frozenAmount,
      title: "系统总览",
      summary: "围绕任务审核、资金流转和风险动作的单日总览。",
      metrics: [
        {
          label: "任务总数",
          value: `${tasks.length}`,
          trend: "基于真实任务仓储",
        },
        {
          label: "暂停任务",
          value: `${pausedTasks}`,
          trend: pausedTasks > 0 ? "存在待恢复任务" : "当前无暂停任务",
        },
        {
          label: "封禁账号",
          value: `${bannedUsers}`,
          trend: "按真实用户状态统计",
        },
        {
          label: "治理动作",
          value: `${repository.listOperatorActions().length}`,
          trend: "按审计日志累计",
        },
      ],
      alerts:
        operatorActions.length > 0
          ? operatorActions.map((action) => ({
              title: action.action,
              detail: `${action.targetId} / ${action.reason}`,
            }))
          : [
              {
                title: "暂无治理动作",
                detail: "系统尚未记录 operator 审计动作。",
              },
            ],
    });
  });

  app.get("/admin/tasks", ({ request, query }) => {
    requireRole(request, "operator");
    const page = coercePositiveInteger(query.get("page"), 1);
    const pageSize = coercePositiveInteger(query.get("pageSize"), 20);
    if (pageSize > 100) {
      throw new AppError(400, "invalid admin input");
    }
    const status = query.get("status");
    const keyword = query.get("keyword")?.trim().toLowerCase();
    const items = repository
      .listTasks()
      .filter((task) => (status ? task.status === status : true))
      .filter((task) =>
        keyword
          ? task.id.toLowerCase().includes(keyword) ||
            task.title.toLowerCase().includes(keyword)
          : true
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        merchantId: task.merchantId,
        status: task.status,
        submissionCount: repository.listSubmissionsByTask(task.id).length,
        escrowLockedAmount: task.escrowLockedAmount,
        updatedAt: new Date().toISOString(),
      }));

    return json(paginate(items, page, pageSize));
  });

  app.get("/admin/tasks/:taskId", ({ request, params }) => {
    requireRole(request, "operator");
    const task = repository.getTask(params.taskId);
    if (!task) {
      throw new AppError(404, "task not found");
    }
    const submissions = repository.listSubmissionsByTask(task.id);
    const governanceActions = repository
      .listOperatorActions()
      .filter(
        (action) =>
          action.targetType === "task" &&
          action.targetId === task.id &&
          (action.action === "pause-task" || action.action === "resume-task")
      )
      .map((action) => ({
        action: action.action,
        operatorId: action.operatorId,
        reason: action.reason,
      }));

    return json({
      id: task.id,
      title: task.title,
      merchantId: task.merchantId,
      status: task.status,
      escrowLockedAmount: task.escrowLockedAmount,
      submissionStats: {
        total: submissions.length,
        approved: submissions.filter((item) => item.status === "approved").length,
        pending: submissions.filter((item) => item.status === "submitted").length,
      },
      governanceActions,
    });
  });

  app.get("/admin/users", ({ request, query }) => {
    requireRole(request, "operator");
    const page = coercePositiveInteger(query.get("page"), 1);
    const pageSize = coercePositiveInteger(query.get("pageSize"), 20);
    if (pageSize > 100) {
      throw new AppError(400, "invalid admin input");
    }
    const state = query.get("state");
    const role = query.get("role");
    const keyword = query.get("keyword")?.trim().toLowerCase();

    const items = repository
      .listUsers()
      .filter((user) => (state ? user.state === state : true))
      .filter((user) => (role ? user.roles.includes(role) : true))
      .filter((user) =>
        keyword
          ? user.id.toLowerCase().includes(keyword) ||
            user.identifier.toLowerCase().includes(keyword) ||
            user.displayName.toLowerCase().includes(keyword)
          : true
      )
      .map((user) => ({
        id: user.id,
        identifier: user.identifier,
        displayName: user.displayName,
        roles: user.roles,
        state: user.state,
      }));

    return json(paginate(items, page, pageSize));
  });

  app.get("/admin/settings", ({ request }) => {
    requireRole(request, "operator");
    return json({ ...adminSettings });
  });

  app.put("/admin/settings", async ({ request }) => {
    const session = requireRole(request, "operator");
    const body = await readJson(request, "invalid admin input");

    if (
      (body.allowTaskPublish !== undefined &&
        typeof body.allowTaskPublish !== "boolean") ||
      (body.enableTipReward !== undefined &&
        typeof body.enableTipReward !== "boolean") ||
      (body.dailyTaskRewardCap !== undefined &&
        (!Number.isFinite(body.dailyTaskRewardCap) || body.dailyTaskRewardCap < 0))
    ) {
      throw new AppError(400, "invalid admin input");
    }

    const before = { ...adminSettings };
    if (body.allowTaskPublish !== undefined) {
      adminSettings.allowTaskPublish = body.allowTaskPublish;
    }
    if (body.enableTipReward !== undefined) {
      adminSettings.enableTipReward = body.enableTipReward;
    }
    if (body.dailyTaskRewardCap !== undefined) {
      adminSettings.dailyTaskRewardCap = body.dailyTaskRewardCap;
    }

    repository.createOperatorAction({
      operatorId: session.userId,
      action: "update-settings",
      targetType: "settings",
      targetId: "global",
      reason: JSON.stringify({ before, after: { ...adminSettings } }),
    });

    return json({ ...adminSettings });
  });

  app.post("/admin/tasks/:taskId/pause", async ({ request, params }) => {
    const session = requireRole(request, "operator");
    const body = await readJson(request, "invalid admin input");
    if (typeof body.reason !== "string" || body.reason.trim() === "") {
      throw new AppError(400, "invalid admin input");
    }
    const task = repository.getTask(params.taskId);
    if (!task) {
      throw new AppError(404, "task not found");
    }
    if (task.status !== "published") {
      throw new AppError(403, "task cannot be paused");
    }

    const updated = repository.saveTask({
      ...task,
      status: "paused",
    });
    repository.createOperatorAction({
      operatorId: session.userId,
      action: "pause-task",
      targetType: "task",
      targetId: task.id,
      reason: body.reason.trim(),
    });

    return json(updated);
  });

  app.post("/admin/tasks/:taskId/resume", async ({ request, params }) => {
    const session = requireRole(request, "operator");
    const body = await readJson(request, "invalid admin input");
    if (typeof body.reason !== "string" || body.reason.trim() === "") {
      throw new AppError(400, "invalid admin input");
    }
    const task = repository.getTask(params.taskId);
    if (!task) {
      throw new AppError(404, "task not found");
    }
    if (task.status !== "paused") {
      throw new AppError(403, "task cannot be resumed");
    }

    const updated = repository.saveTask({
      ...task,
      status: "published",
    });
    repository.createOperatorAction({
      operatorId: session.userId,
      action: "resume-task",
      targetType: "task",
      targetId: task.id,
      reason: body.reason.trim(),
    });

    return json(updated);
  });

  app.post("/admin/users/:userId/ban", async ({ request, params }) => {
    const session = requireRole(request, "operator");
    const body = await readJson(request, "invalid admin input");
    if (typeof body.reason !== "string" || body.reason.trim() === "") {
      throw new AppError(400, "invalid admin input");
    }

    const updated = repository.updateUserState(params.userId, "banned");
    if (!updated) {
      throw new AppError(404, "user not found");
    }

    repository.createOperatorAction({
      operatorId: session.userId,
      action: "ban-user",
      targetType: "user",
      targetId: updated.id,
      reason: body.reason.trim(),
    });

    return json({
      userId: updated.id,
      state: updated.state,
    });
  });

  app.post("/admin/ledger/:entryId/mark-anomaly", async ({ request, params }) => {
    const session = requireRole(request, "operator");
    const body = await readJson(request, "invalid admin input");
    if (typeof body.reason !== "string" || body.reason.trim() === "") {
      throw new AppError(400, "invalid admin input");
    }

    const updated = repository.markLedgerAnomaly(
      params.entryId,
      body.reason.trim()
    );
    if (!updated) {
      throw new AppError(404, "ledger entry not found");
    }

    repository.createOperatorAction({
      operatorId: session.userId,
      action: "mark-ledger-anomaly",
      targetType: "ledger",
      targetId: updated.id,
      reason: body.reason.trim(),
    });

    return json({
      entryId: updated.id,
      status: "flagged",
      anomalyReason: updated.anomalyReason,
    });
  });

  app.get("/admin/ledger", ({ request }) => {
    requireRole(request, "operator");
    return json(
      paginate(
        repository.listOperatorActions().map((action) => ({
          id: action.id,
          action: action.action,
          targetId: action.targetId,
          targetType: action.targetType,
          operatorId: action.operatorId,
          reason: action.reason,
        })),
        1,
        20
      )
    );
  });

  app.close = () => {
    if (!usingDefaultContext && typeof dbContext.close === "function") {
      dbContext.close();
    }
  };

  return app;
}

export const app = createApiApp({
  dbContext: {
    db: defaultDb,
    sqliteDb: defaultSqliteDb,
  },
});

if (import.meta.main && typeof Bun !== "undefined") {
  const port = Number(process.env.API_PORT ?? process.env.PORT ?? "26411");
  Bun.serve({
    port,
    fetch: app.fetch,
  });
  console.log(`[api] listening on http://127.0.0.1:${port}`);
}

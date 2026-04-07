import type { Context } from "hono";
import type {
  CreateMerchantTaskDraftInput,
  MerchantTaskAttachment
} from "@meow/contracts";
import { Hono } from "hono";
import { AppError } from "../lib/errors.js";
import { requireSession } from "../lib/session.js";
import { readMerchantUploadedAsset, saveMerchantTaskAssets } from "../lib/uploads.js";
import {
  createRankingReward,
  createTipReward,
  reviewSubmission
} from "../services/rewards.js";
import { settleTask } from "../services/settlement.js";
import { listMerchantTaskSubmissions } from "../services/submissions.js";
import {
  createTaskDraft,
  getMerchantTaskDetail,
  listMerchantTasks,
  publishTask
} from "../services/tasks.js";
import { getMerchantWalletSnapshot } from "../services/wallet.js";

export const merchantRoutes = new Hono();

const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_REQUEST_BYTES = 10 * 1024 * 1024;

const parseContentLength = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const size = Number(value);
  if (!Number.isFinite(size) || size < 0) {
    return null;
  }

  return Math.floor(size);
};

const ensureMerchantUploadRequestSize = (c: Context): void => {
  const contentLength = parseContentLength(c.req.header("content-length"));
  if (
    contentLength !== null &&
    contentLength > MAX_UPLOAD_REQUEST_BYTES
  ) {
    throw new AppError(413, "upload request too large");
  }
};

const ensureMerchantUploadFileSizes = (files: File[]): void => {
  let totalSize = 0;

  for (const file of files) {
    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      throw new AppError(413, "upload file too large");
    }

    totalSize += file.size;
    if (totalSize > MAX_UPLOAD_REQUEST_BYTES) {
      throw new AppError(413, "upload request too large");
    }
  }
};

const requireMerchantSession = (c: Context) => {
  const session = requireSession(c);

  if (session.activeRole !== "merchant") {
    throw new AppError(403, "merchant access denied");
  }

  return session;
};

const readMerchantJson = async (c: Context): Promise<Record<string, unknown>> => {
  const contentType = c.req.header("content-type");

  if (!contentType?.includes("application/json")) {
    return {};
  }

  try {
    const json = await c.req.json();

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      throw new AppError(400, "invalid merchant input");
    }

    return json as Record<string, unknown>;
  } catch {
    throw new AppError(400, "invalid merchant input");
  }
};

const parseMerchantTaskAttachments = (
  value: unknown
): MerchantTaskAttachment[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError(400, "invalid task attachments");
  }

  return value.map((item) => {
    if (!item || typeof item !== "object") {
      throw new AppError(400, "invalid task attachments");
    }

    const attachment = item as Record<string, unknown>;

    if (
      typeof attachment.id !== "string" ||
      (attachment.kind !== "image" && attachment.kind !== "video") ||
      typeof attachment.url !== "string" ||
      typeof attachment.fileName !== "string" ||
      typeof attachment.mimeType !== "string"
    ) {
      throw new AppError(400, "invalid task attachments");
    }

    return {
      id: attachment.id,
      kind: attachment.kind,
      url: attachment.url,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType
    };
  });
};

const parseCreateTaskInput = (
  input: Record<string, unknown>
): CreateMerchantTaskDraftInput => {
  const title = input.title;
  const baseAmount = input.baseAmount;
  const baseCount = input.baseCount;
  const rankingTotal = input.rankingTotal;
  const normalizedBaseAmount =
    typeof baseAmount === "number" && !Number.isNaN(baseAmount) ? baseAmount : 0;
  const normalizedBaseCount =
    typeof baseCount === "number" && !Number.isNaN(baseCount) ? baseCount : 0;
  const normalizedRankingTotal =
    typeof rankingTotal === "number" && !Number.isNaN(rankingTotal)
      ? rankingTotal
      : 0;

  return {
    title: typeof title === "string" && title.trim() ? title.trim() : "未命名需求",
    baseAmount: normalizedBaseAmount,
    baseCount: normalizedBaseCount,
    rankingTotal: normalizedRankingTotal,
    assetAttachments: parseMerchantTaskAttachments(input.assetAttachments)
  };
};

merchantRoutes.post("/tasks", async (c) => {
  const session = requireMerchantSession(c);
  const body = parseCreateTaskInput(await readMerchantJson(c));
  const response = createTaskDraft(session.userId, body);

  return c.json(response, 201);
});

merchantRoutes.get("/tasks", (c) => {
  const session = requireMerchantSession(c);
  const pageRaw = c.req.query("page");
  const pageSizeRaw = c.req.query("pageSize");
  const page = pageRaw ? Number(pageRaw) : 1;
  const pageSize = pageSizeRaw ? Number(pageSizeRaw) : 20;
  if (!Number.isInteger(page) || !Number.isInteger(pageSize) || page <= 0 || pageSize <= 0 || pageSize > 100) {
    throw new AppError(400, "invalid pagination");
  }
  const all = listMerchantTasks(session.userId);
  const total = all.length;
  const offset = (page - 1) * pageSize;
  const items = all.slice(offset, offset + pageSize);
  return c.json({ items, pagination: { page, pageSize, total } });
});

merchantRoutes.get("/tasks/:taskId", (c) => {
  const session = requireMerchantSession(c);

  return c.json(getMerchantTaskDetail(session.userId, c.req.param("taskId")));
});

merchantRoutes.post("/tasks/:taskId/publish", (c) => {
  const session = requireMerchantSession(c);
  const taskId = c.req.param("taskId");
  const response = publishTask(session.userId, taskId);

  return c.json(response);
});

merchantRoutes.get("/tasks/:taskId/submissions", (c) => {
  const session = requireMerchantSession(c);

  return c.json(listMerchantTaskSubmissions(session.userId, c.req.param("taskId")));
});

merchantRoutes.post("/uploads", async (c) => {
  requireMerchantSession(c);
  ensureMerchantUploadRequestSize(c);
  const formData = await c.req.formData();
  const files = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File);
  ensureMerchantUploadFileSizes(files);
  const attachments = await saveMerchantTaskAssets(files);

  return c.json({ attachments }, 201);
});

merchantRoutes.get("/uploads/:storageName", async (c) => {
  requireSession(c);
  const asset = await readMerchantUploadedAsset(c.req.param("storageName"));

  return new Response(asset.body, {
    headers: {
      "content-type": asset.mimeType,
      "cache-control": "private, max-age=86400"
    }
  });
});

merchantRoutes.get("/wallet", (c) => {
  const session = requireMerchantSession(c);

  return c.json(getMerchantWalletSnapshot(session.userId));
});

merchantRoutes.post("/submissions/:submissionId/review", async (c) => {
  const session = requireMerchantSession(c);
  const body = await readMerchantJson(c);
  const decision = body.decision;

  if (
    decision !== undefined &&
    decision !== "approved" &&
    decision !== "rejected"
  ) {
    throw new AppError(400, "invalid review input");
  }

  return c.json(
    reviewSubmission(
      session.userId,
      c.req.param("submissionId"),
      decision === "rejected" ? "rejected" : "approved"
    )
  );
});

merchantRoutes.post("/submissions/:submissionId/tips", (c) => {
  const session = requireMerchantSession(c);

  return c.json(createTipReward(session.userId, c.req.param("submissionId")), 201);
});

merchantRoutes.post("/tasks/:taskId/rewards/ranking", async (c) => {
  const session = requireMerchantSession(c);
  const body = await readMerchantJson(c);
  const submissionId = body.submissionId;

  if (
    submissionId !== undefined &&
    (typeof submissionId !== "string" || submissionId.trim().length === 0)
  ) {
    throw new AppError(400, "invalid ranking input");
  }

  return c.json(
    createRankingReward(
      session.userId,
      c.req.param("taskId"),
      typeof submissionId === "string" ? submissionId : undefined
    ),
    201
  );
});

merchantRoutes.post("/tasks/:taskId/settle", (c) => {
  const session = requireMerchantSession(c);

  return c.json(settleTask(session.userId, c.req.param("taskId")));
});

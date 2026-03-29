import type { Context } from "hono";
import { Hono } from "hono";
import { AppError } from "../lib/errors.js";
import { requireSession } from "../lib/session.js";
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

merchantRoutes.post("/tasks", (c) => {
  const session = requireMerchantSession(c);
  const response = createTaskDraft(session.userId);

  return c.json(response, 201);
});

merchantRoutes.get("/tasks", (c) => {
  const session = requireMerchantSession(c);

  return c.json(listMerchantTasks(session.userId));
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

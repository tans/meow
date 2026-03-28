import type { Context } from "hono";
import { Hono } from "hono";
import { AppError } from "../lib/errors.js";
import { requireMerchant } from "../lib/session.js";
import {
  createRankingReward,
  createTipReward,
  reviewSubmission
} from "../services/rewards.js";
import { settleTask } from "../services/settlement.js";
import { createTaskDraft, publishTask } from "../services/tasks.js";

export const merchantRoutes = new Hono();

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
  const session = requireMerchant(c);
  const response = createTaskDraft(session.merchantId);

  return c.json(response, 201);
});

merchantRoutes.post("/tasks/:taskId/publish", (c) => {
  const session = requireMerchant(c);
  const taskId = c.req.param("taskId");
  const response = publishTask(session.merchantId, taskId);

  return c.json(response);
});

merchantRoutes.post("/submissions/:submissionId/review", async (c) => {
  const session = requireMerchant(c);
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
      session.merchantId,
      c.req.param("submissionId"),
      decision === "rejected" ? "rejected" : "approved"
    )
  );
});

merchantRoutes.post("/submissions/:submissionId/tips", (c) => {
  const session = requireMerchant(c);

  return c.json(
    createTipReward(session.merchantId, c.req.param("submissionId")),
    201
  );
});

merchantRoutes.post("/tasks/:taskId/rewards/ranking", async (c) => {
  const session = requireMerchant(c);
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
      session.merchantId,
      c.req.param("taskId"),
      typeof submissionId === "string" ? submissionId : undefined
    ),
    201
  );
});

merchantRoutes.post("/tasks/:taskId/settle", (c) => {
  const session = requireMerchant(c);

  return c.json(settleTask(session.merchantId, c.req.param("taskId")));
});

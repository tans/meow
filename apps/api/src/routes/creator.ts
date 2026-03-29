import type { Context } from "hono";
import { Hono } from "hono";
import { AppError } from "../lib/errors.js";
import { requireSession } from "../lib/session.js";
import {
  createSubmission,
  getCreatorTaskDetail,
  listCreatorTaskSubmissions,
  listCreatorSubmissions,
  listPublicTasks,
  updateSubmission,
  withdrawSubmission
} from "../services/submissions.js";
import { getCreatorWalletSnapshot } from "../services/wallet.js";

export const creatorRoutes = new Hono();

const requireCreatorSession = (c: Context) => {
  const session = requireSession(c);

  if (session.activeRole !== "creator") {
    throw new AppError(403, "creator access denied");
  }

  return session;
};

creatorRoutes.get("/tasks", (c) => {
  requireCreatorSession(c);
  return c.json(listPublicTasks());
});
creatorRoutes.get("/tasks/:taskId", (c) => {
  const session = requireCreatorSession(c);
  return c.json(getCreatorTaskDetail(session.userId, c.req.param("taskId")));
});
creatorRoutes.get("/tasks/:taskId/submissions", (c) => {
  const session = requireCreatorSession(c);
  return c.json(listCreatorTaskSubmissions(session.userId, c.req.param("taskId")));
});
creatorRoutes.get("/submissions", (c) => {
  const session = requireCreatorSession(c);
  return c.json(listCreatorSubmissions(session.userId));
});
creatorRoutes.get("/wallet", (c) => {
  const session = requireCreatorSession(c);
  return c.json(getCreatorWalletSnapshot(session.userId));
});

const parseSubmissionInput = (input: unknown): {
  assetUrl: string;
  description: string;
} => {
  if (!input || typeof input !== "object") {
    throw new AppError(400, "invalid submission input");
  }

  const { assetUrl, description } = input as Record<string, unknown>;

  if (
    typeof assetUrl !== "string" ||
    assetUrl.trim() === "" ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    throw new AppError(400, "invalid submission input");
  }

  return {
    assetUrl,
    description
  };
};

creatorRoutes.post("/tasks/:taskId/submissions", async (c) => {
  const session = requireCreatorSession(c);
  const taskId = c.req.param("taskId");
  let json: unknown;

  try {
    json = await c.req.json();
  } catch {
    throw new AppError(400, "invalid submission json");
  }

  const body = parseSubmissionInput(json);
  const response = createSubmission(session.userId, taskId, body);

  return c.json(response, 201);
});

creatorRoutes.patch("/submissions/:submissionId", async (c) => {
  const session = requireCreatorSession(c);
  let json: unknown;

  try {
    json = await c.req.json();
  } catch {
    throw new AppError(400, "invalid submission json");
  }

  const body = parseSubmissionInput(json);

  return c.json(updateSubmission(session.userId, c.req.param("submissionId"), body));
});

creatorRoutes.post("/submissions/:submissionId/withdraw", (c) => {
  const session = requireCreatorSession(c);

  return c.json(withdrawSubmission(session.userId, c.req.param("submissionId")));
});

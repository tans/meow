import { Hono } from "hono";
import { AppError } from "../lib/errors.js";
import { requireCreator } from "../lib/session.js";
import { createSubmission, listPublicTasks } from "../services/submissions.js";

export const creatorRoutes = new Hono();

creatorRoutes.get("/tasks", (c) => c.json(listPublicTasks()));

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
  const creator = requireCreator(c);
  const taskId = c.req.param("taskId");
  let json: unknown;

  try {
    json = await c.req.json();
  } catch {
    throw new AppError(400, "invalid submission json");
  }

  const body = parseSubmissionInput(json);
  const response = createSubmission(creator.id, taskId, body);

  return c.json(response, 201);
});

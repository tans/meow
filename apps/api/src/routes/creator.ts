import { Hono } from "hono";
import { requireCreator } from "../lib/session.js";
import { createSubmission, listPublicTasks } from "../services/submissions.js";

export const creatorRoutes = new Hono();

creatorRoutes.get("/tasks", (c) => c.json(listPublicTasks()));

creatorRoutes.post("/tasks/:taskId/submissions", async (c) => {
  const creator = requireCreator(c);
  const taskId = c.req.param("taskId");
  const body = (await c.req.json()) as { assetUrl: string; description: string };
  const response = createSubmission(creator.id, taskId, body);

  return c.json(response, 201);
});

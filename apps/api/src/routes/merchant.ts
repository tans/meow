import { Hono } from "hono";
import { requireMerchant } from "../lib/session.js";
import { createTaskDraft, publishTask } from "../services/tasks.js";

export const merchantRoutes = new Hono();

merchantRoutes.post("/tasks", (c) => {
  const session = requireMerchant(c);
  const response = createTaskDraft(session.merchantId);

  return c.json(response, 201);
});

merchantRoutes.post("/tasks/:taskId/publish", (c) => {
  const session = requireMerchant(c);
  const taskId = c.req.param("taskId");
  const response = publishTask(taskId, session.merchantId);

  return c.json(response);
});

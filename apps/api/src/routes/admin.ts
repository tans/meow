import type { AuthSessionPayload } from "@meow/contracts";
import type { Context } from "hono";
import { Hono } from "hono";
import { AppError } from "../lib/errors.js";
import { requireSession } from "../lib/session.js";
import {
  banUser,
  listDashboard,
  listLedgerRows,
  markLedgerAnomaly,
  pauseTask,
  resumeTask
} from "../services/admin.js";

export const adminRoutes = new Hono<{
  Variables: {
    session: AuthSessionPayload;
  };
}>();

const requireOperatorSession = (c: Context): AuthSessionPayload => {
  const session = requireSession(c);

  if (session.activeRole !== "operator") {
    throw new AppError(403, "operator access denied");
  }

  return session;
};

const readAdminJson = async (c: Context): Promise<Record<string, unknown>> => {
  try {
    const json = await c.req.json();

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      throw new AppError(400, "invalid admin input");
    }

    return json as Record<string, unknown>;
  } catch {
    throw new AppError(400, "invalid admin input");
  }
};

const parseReasonInput = (input: Record<string, unknown>): { reason: string } => {
  const reason = input.reason;

  if (typeof reason !== "string" || reason.trim() === "") {
    throw new AppError(400, "invalid admin input");
  }

  return {
    reason: reason.trim()
  };
};

adminRoutes.use("*", async (c, next) => {
  c.set("session", requireOperatorSession(c));
  await next();
});

adminRoutes.get("/dashboard", (c) => c.json(listDashboard()));

adminRoutes.post("/tasks/:taskId/pause", async (c) => {
  const session = c.get("session");
  const body = parseReasonInput(await readAdminJson(c));

  return c.json(
    pauseTask({
      operatorId: session.userId,
      taskId: c.req.param("taskId"),
      reason: body.reason
    })
  );
});

adminRoutes.post("/tasks/:taskId/resume", async (c) => {
  const session = c.get("session");
  const body = parseReasonInput(await readAdminJson(c));

  return c.json(
    resumeTask({
      operatorId: session.userId,
      taskId: c.req.param("taskId"),
      reason: body.reason
    })
  );
});

adminRoutes.post("/users/:userId/ban", async (c) => {
  const session = c.get("session");
  const body = parseReasonInput(await readAdminJson(c));

  return c.json(
    banUser({
      operatorId: session.userId,
      userId: c.req.param("userId"),
      reason: body.reason
    })
  );
});

adminRoutes.post("/ledger/:entryId/mark-anomaly", async (c) => {
  const session = c.get("session");
  const body = parseReasonInput(await readAdminJson(c));

  return c.json(
    markLedgerAnomaly({
      operatorId: session.userId,
      entryId: c.req.param("entryId"),
      reason: body.reason
    })
  );
});

adminRoutes.get("/ledger", (c) => c.json(listLedgerRows()));

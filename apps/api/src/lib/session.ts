import type { Context } from "hono";
import type { AuthSessionPayload } from "@meow/contracts";
import { getCookie } from "hono/cookie";
import { db } from "./db.js";
import { AppError } from "./errors.js";

export interface MerchantSession {
  merchantId: "merchant-1";
}

export interface CreatorSession {
  id: "creator-1";
}

export const requireSession = (c: Context): AuthSessionPayload => {
  const sessionId = getCookie(c, "meow_session");

  if (!sessionId) {
    throw new AppError(401, "missing session");
  }

  const session = db.findSession(sessionId);
  if (!session) {
    throw new AppError(401, "invalid session");
  }

  const user = db.getUser(session.userId);
  if (!user) {
    throw new AppError(401, "invalid session");
  }

  if (!user.roles.includes(session.activeRole)) {
    throw new AppError(401, "invalid session");
  }

  return {
    sessionId: session.id,
    userId: user.id,
    activeRole: session.activeRole,
    roles: user.roles
  };
};

export const requireMerchant = (c: Context): MerchantSession => {
  const demoUser = c.req.header("x-demo-user");

  if (!demoUser) {
    throw new AppError(401, "missing demo merchant header");
  }

  if (demoUser !== "merchant-1") {
    throw new AppError(403, "merchant access denied");
  }

  return { merchantId: "merchant-1" };
};

export const requireCreator = (c: Context): CreatorSession => {
  const demoUser = c.req.header("x-demo-user");

  if (!demoUser) {
    throw new AppError(401, "missing demo creator header");
  }

  if (demoUser !== "creator-1") {
    throw new AppError(403, "creator access denied");
  }

  return { id: "creator-1" };
};

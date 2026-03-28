import type { Context } from "hono";
import { AppError } from "./errors.js";

export interface MerchantSession {
  merchantId: "merchant-1";
}

export interface CreatorSession {
  id: "creator-1";
}

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

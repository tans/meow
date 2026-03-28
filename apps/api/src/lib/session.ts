import type { Context } from "hono";
import { AppError } from "./errors.js";

export interface MerchantSession {
  merchantId: "merchant-1";
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

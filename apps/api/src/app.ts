import { surfaceIds } from "@meow/contracts";
import { Hono } from "hono";
import { isAppError } from "./lib/errors.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { creatorRoutes } from "./routes/creator.js";
import { merchantRoutes } from "./routes/merchant.js";

export const app = new Hono();

app.onError((error, c) => {
  if (isAppError(error)) {
    return c.json({ error: error.message }, { status: error.status });
  }
  // Catch all unexpected errors — don't re-throw, return safe 500
  console.error("[api] unhandled error:", error);
  return c.json({ error: "INTERNAL_ERROR", message: "An unexpected error occurred" }, 500);
});

app.notFound((c) => c.json({ error: "NOT_FOUND", message: "Route not found" }, 404));

const startTime = Date.now();
app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "meow-api",
    surfaces: surfaceIds,
    uptime: `${Math.round((Date.now() - startTime) / 1000)}s`,
    timestamp: new Date().toISOString(),
  })
);
app.route("/auth", authRoutes);
app.route("/admin", adminRoutes);
app.route("/creator", creatorRoutes);
app.route("/merchant", merchantRoutes);

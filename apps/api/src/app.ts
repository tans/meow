import { surfaceIds } from "@meow/contracts";
import { Hono } from "hono";
import { createErrorResponse, toErrorResponse } from "./lib/errors.js";
import { sqliteDb } from "./lib/db.js";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { creatorRoutes } from "./routes/creator.js";
import { merchantRoutes } from "./routes/merchant.js";
import { requestLogger } from "./middleware/requestLogger.js";

export const app = new Hono();

// Request logging must come before error handler and routes
app.use("*", requestLogger);

app.onError((error, c) => {
  const response = toErrorResponse(error);

  if (response.status === 500) {
    console.error("[api] unhandled error:", error);
  }

  return c.json(response, response.status);
});

app.notFound((c) => {
  const response = createErrorResponse(404, "Route not found");

  return c.json(response, response.status);
});

const startTime = Date.now();
app.get("/health", (c) => {
  let dbOk = false;
  try {
    sqliteDb.exec("SELECT 1");
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return c.json({
    ok: true,
    service: "meow-api",
    surfaces: surfaceIds,
    uptime: `${Math.round((Date.now() - startTime) / 1000)}s`,
    timestamp: new Date().toISOString(),
    db: dbOk ? "ok" : "error",
  });
});

// Version endpoint for monitoring
const BUILD_TIME = new Date().toISOString();
const VERSION = process.env.npm_package_version ?? "0.1.0";
app.get("/version", (c) =>
  c.json({
    version: VERSION,
    buildTime: BUILD_TIME,
    nodeVersion: process.version,
    uptime: `${Math.round((Date.now() - startTime) / 1000)}s`,
  })
);

// Public platform stats (no auth required)
app.get("/stats", (c) => {
  try {
    const totalTasks = sqliteDb.prepare("select count(*) as c from tasks where status = 'published'").get() as { c: number };
    const totalSubmissions = sqliteDb.prepare("select count(*) as c from submissions").get() as { c: number };
    const totalCreators = sqliteDb.prepare("select count(*) as c from users where role = 'creator'").get() as { c: number };
    return c.json({
      tasks: totalTasks.c,
      submissions: totalSubmissions.c,
      creators: totalCreators.c,
      surfaces: surfaceIds,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return c.json({ tasks: 0, submissions: 0, creators: 0, surfaces: surfaceIds, timestamp: new Date().toISOString() });
  }
});

app.route("/auth", authRoutes);
app.route("/admin", adminRoutes);
app.route("/creator", creatorRoutes);
app.route("/merchant", merchantRoutes);

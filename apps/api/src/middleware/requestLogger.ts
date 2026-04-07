import type { MiddlewareHandler } from "hono";

/** Get client IP from request headers or connection info */
function getClientIP(c: { req: { header: (name: string) => string | undefined }; }): string {
  // Check common proxy headers first
  const xForwardedFor = c.req.header("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();
  const xRealIp = c.req.header("x-real-ip");
  if (xRealIp) return xRealIp;
  const cfConnectingIp = c.req.header("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  return "unknown";
}

/** Paths to skip logging (health checks, monitoring) */
const SKIP_PATHS = new Set(["/health", "/version"]);

/**
 * Request logging middleware.
 * Logs: method, path, status, response time (ms), client IP.
 * Skips /health and /version. Logs extra error detail for 4xx/5xx.
 */
export const requestLogger: MiddlewareHandler = async (c, next) => {
  const path = c.req.path;
  const method = c.req.method;
  const skip = SKIP_PATHS.has(path);

  const start = Date.now();

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  const ip = getClientIP(c);

  if (skip) return;

  const elapsed = `${duration}ms`;
  const ts = new Date().toISOString();

  if (status >= 400) {
    const errorMessage = c.error?.message ?? c.res.statusText ?? "unknown";
    console.log(`[${ts}] ${method} ${path} ${status} ${elapsed} ip=${ip} error="${errorMessage}"`);
  } else {
    console.log(`[${ts}] ${method} ${path} ${status} ${elapsed} ip=${ip}`);
  }
};

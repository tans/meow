import { Hono } from "hono";
import { isAppError } from "./lib/errors.js";
import { authRoutes } from "./routes/auth.js";
import { creatorRoutes } from "./routes/creator.js";
import { merchantRoutes } from "./routes/merchant.js";

export const app = new Hono();

app.onError((error, c) => {
  if (isAppError(error)) {
    return c.json({ error: error.message }, { status: error.status });
  }

  throw error;
});

app.get("/health", (c) => c.json({ ok: true, service: "meow-api" }));
app.route("/auth", authRoutes);
app.route("/creator", creatorRoutes);
app.route("/merchant", merchantRoutes);

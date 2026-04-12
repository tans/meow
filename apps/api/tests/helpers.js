import { expect } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../app.js";

export function toCookieHeader(setCookieHeader) {
  return String(setCookieHeader || "")
    .split(/,(?=[^;]+=[^;]+)/)
    .map((cookie) => cookie.split(";")[0]?.trim() || "")
    .filter(Boolean)
    .join("; ");
}

export function createTestContext() {
  const uploadDir = mkdtempSync(join(tmpdir(), "meow-api-test-"));
  const app = createApp({
    isTest: true,
    seed: true,
    uploadDir,
  });

  return {
    app,
    uploadDir,
    cleanup() {
      app.close();
      rmSync(uploadDir, { recursive: true, force: true });
    },
  };
}

export async function loginAs(app, identifier, client = "web") {
  const response = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier,
      secret: "demo-pass",
      client,
    }),
  });

  expect(response.status).toBe(200);
  const cookieHeader = toCookieHeader(response.headers.get("set-cookie"));
  expect(cookieHeader).toContain("meow_session=");
  return cookieHeader;
}

import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createTestContext, toCookieHeader } from "./helpers.js";

const originalCookieSecure = process.env.MEOW_COOKIE_SECURE;
let testContext;

function resetEnv() {
  delete process.env.MEOW_COOKIE_SECURE;
}

async function login(input = {}) {
  return testContext.app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier: input.identifier || "hybrid@example.com",
      secret: input.secret || "demo-pass",
      client: input.client || "web",
    }),
  });
}

describe("auth session routes", () => {
  beforeEach(() => {
    resetEnv();
    testContext = createTestContext();
  });

  afterEach(() => {
    testContext.cleanup();
  });

  afterAll(() => {
    if (originalCookieSecure === undefined) {
      delete process.env.MEOW_COOKIE_SECURE;
      return;
    }
    process.env.MEOW_COOKIE_SECURE = originalCookieSecure;
  });

  it("returns a session payload and session cookie", async () => {
    const response = await login();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      user: {
        id: "hybrid-1",
        displayName: "Demo Hybrid",
      },
      activeRole: "creator",
      roles: ["creator", "merchant"],
    });
    const cookieHeader = response.headers.get("set-cookie") || "";
    expect(cookieHeader).toContain("meow_session=");
    expect(cookieHeader).toContain("HttpOnly");
    expect(cookieHeader).toContain("SameSite=Lax");
    expect(cookieHeader).toContain("Max-Age=");
    expect(cookieHeader).not.toContain("Secure");
  });

  it("adds Secure cookie attribute when configured", async () => {
    process.env.MEOW_COOKIE_SECURE = "true";

    const response = await login();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Secure");
  });

  it("restores the current session from cookie", async () => {
    const loginResponse = await login();
    const cookie = toCookieHeader(loginResponse.headers.get("set-cookie"));

    const response = await testContext.app.request("/auth/session", {
      headers: { cookie },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      userId: "hybrid-1",
      activeRole: "creator",
      roles: ["creator", "merchant"],
    });
  });

  it("returns 401 when cookie is missing", async () => {
    const response = await testContext.app.request("/auth/session");

    expect(response.status).toBe(401);
  });

  it("returns 401 for invalid credentials", async () => {
    const response = await login({ secret: "bad-pass" });

    expect(response.status).toBe(401);
  });

  it("switches hybrid session from creator to merchant", async () => {
    const loginResponse = await login();
    const cookie = toCookieHeader(loginResponse.headers.get("set-cookie"));

    const response = await testContext.app.request("/auth/switch-role", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ role: "merchant" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      userId: "hybrid-1",
      activeRole: "merchant",
      roles: ["creator", "merchant"],
    });
  });
});

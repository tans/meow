import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";

const originalDemoAuth = process.env.MEOW_DEMO_AUTH;
const originalAuthMode = process.env.MEOW_AUTH_MODE;
const originalCookieSecure = process.env.MEOW_COOKIE_SECURE;

const resetAuthEnv = (): void => {
  delete process.env.MEOW_DEMO_AUTH;
  delete process.env.MEOW_AUTH_MODE;
  delete process.env.MEOW_COOKIE_SECURE;
};

const enableDemoAuth = (): void => {
  process.env.MEOW_DEMO_AUTH = "true";
};

const login = async (input?: {
  identifier?: string;
  secret?: string;
  client?: string;
}) =>
  app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier: input?.identifier ?? "hybrid@example.com",
      secret: input?.secret ?? "demo-pass",
      client: input?.client ?? "web"
    })
  });

const loginHybrid = async (): Promise<string> => {
  const response = await login();

  expect(response.status).toBe(200);
  const cookie = response.headers.get("set-cookie");
  expect(cookie).toContain("meow_session=");

  return cookie ?? "";
};

describe("auth session routes", () => {
  beforeEach(() => {
    resetAuthEnv();
  });

  afterAll(() => {
    if (originalDemoAuth === undefined) {
      delete process.env.MEOW_DEMO_AUTH;
    } else {
      process.env.MEOW_DEMO_AUTH = originalDemoAuth;
    }

    if (originalAuthMode === undefined) {
      delete process.env.MEOW_AUTH_MODE;
    } else {
      process.env.MEOW_AUTH_MODE = originalAuthMode;
    }

    if (originalCookieSecure === undefined) {
      delete process.env.MEOW_COOKIE_SECURE;
    } else {
      process.env.MEOW_COOKIE_SECURE = originalCookieSecure;
    }
  });

  it("POST /auth/login fails closed unless demo auth is enabled", async () => {
    const response = await login();

    expect(response.status).toBe(403);
  });

  it("POST /auth/login returns a session payload and session cookie", async () => {
    enableDemoAuth();
    const response = await login();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: {
        id: "hybrid-1",
        displayName: "Demo Hybrid"
      },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    });
    const cookieHeader = response.headers.get("set-cookie") ?? "";
    expect(cookieHeader).toContain("meow_session=");
    expect(cookieHeader).toContain("HttpOnly");
    expect(cookieHeader).toContain("SameSite=Lax");
    expect(cookieHeader).toContain("Max-Age=");
    expect(cookieHeader).not.toContain("Secure");
  });

  it("POST /auth/login adds Secure cookie attribute when configured", async () => {
    enableDemoAuth();
    process.env.MEOW_COOKIE_SECURE = "true";

    const response = await login();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Secure");
  });

  it("GET /auth/session restores the current session from cookie", async () => {
    enableDemoAuth();
    const cookie = await loginHybrid();

    const response = await app.request("/auth/session", {
      headers: { cookie }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      userId: "hybrid-1",
      activeRole: "creator",
      roles: ["creator", "merchant"]
    });
  });

  it("GET /auth/session returns 401 when cookie is missing", async () => {
    const response = await app.request("/auth/session");

    expect(response.status).toBe(401);
  });

  it("POST /auth/login returns 401 for invalid credentials", async () => {
    enableDemoAuth();
    const response = await login({ secret: "bad-pass" });

    expect(response.status).toBe(401);
  });

  it("POST /auth/login returns 400 for invalid client", async () => {
    enableDemoAuth();
    const response = await login({ client: "desktop" });

    expect(response.status).toBe(400);
  });

  it("POST /auth/switch-role switches hybrid session from creator to merchant", async () => {
    enableDemoAuth();
    const cookie = await loginHybrid();

    const response = await app.request("/auth/switch-role", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie
      },
      body: JSON.stringify({ role: "merchant" })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      userId: "hybrid-1",
      activeRole: "merchant",
      roles: ["creator", "merchant"]
    });
  });

  it("POST /auth/switch-role returns 403 for unauthorized role switch", async () => {
    enableDemoAuth();
    const creatorLogin = await login({ identifier: "creator@example.com" });
    const creatorCookie = creatorLogin.headers.get("set-cookie") ?? "";

    const response = await app.request("/auth/switch-role", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie
      },
      body: JSON.stringify({ role: "merchant" })
    });

    expect(response.status).toBe(403);
  });

  it("POST /auth/switch-role returns 400 for invalid role", async () => {
    enableDemoAuth();
    const cookie = await loginHybrid();

    const response = await app.request("/auth/switch-role", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie
      },
      body: JSON.stringify({ role: "admin" })
    });

    expect(response.status).toBe(400);
  });
});

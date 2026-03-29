import { describe, expect, it } from "vitest";
import { app } from "../app.js";

const loginHybrid = async (): Promise<string> => {
  const response = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier: "hybrid@example.com",
      secret: "demo-pass",
      client: "web"
    })
  });

  expect(response.status).toBe(200);
  const cookie = response.headers.get("set-cookie");
  expect(cookie).toContain("meow_session=");

  return cookie ?? "";
};

describe("auth session routes", () => {
  it("POST /auth/login returns a session payload and session cookie", async () => {
    const response = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "hybrid@example.com",
        secret: "demo-pass",
        client: "web"
      })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: {
        id: "hybrid-1",
        displayName: "Demo Hybrid"
      },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    });
    expect(response.headers.get("set-cookie")).toContain("meow_session=");
  });

  it("GET /auth/session restores the current session from cookie", async () => {
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

  it("POST /auth/switch-role switches hybrid session from creator to merchant", async () => {
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
});

import { afterAll, describe, expect, it } from "vitest";
import { app } from "../app.js";

const originalDemoAuth = process.env.MEOW_DEMO_AUTH;

const loginMerchant = async (): Promise<string> => {
  process.env.MEOW_DEMO_AUTH = "true";

  const response = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier: "merchant@example.com",
      secret: "demo-pass",
      client: "web"
    })
  });

  expect(response.status).toBe(200);

  return response.headers.get("set-cookie") ?? "";
};

describe("merchant publish flow", () => {
  afterAll(() => {
    if (originalDemoAuth === undefined) {
      delete process.env.MEOW_DEMO_AUTH;
      return;
    }

    process.env.MEOW_DEMO_AUTH = originalDemoAuth;
  });

  it("locks base and ranking budget before publishing", async () => {
    const merchantCookie = await loginMerchant();
    const response = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      ledgerEffect: "merchant_escrow_locked"
    });
  });
});

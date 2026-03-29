import { afterAll, describe, expect, it } from "vitest";
import { app } from "../app.js";

const originalDemoAuth = process.env.MEOW_DEMO_AUTH;

const toCookieHeader = (setCookieHeader: string): string =>
  setCookieHeader
    .split(/,(?=[^;]+=[^;]+)/)
    .map((cookie) => cookie.split(";")[0]?.trim() ?? "")
    .filter((cookie) => cookie.length > 0)
    .join("; ");

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
  const setCookieHeader = response.headers.get("set-cookie") ?? "";
  const cookieHeader = toCookieHeader(setCookieHeader);
  expect(cookieHeader).toContain("meow_session=");

  return cookieHeader;
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

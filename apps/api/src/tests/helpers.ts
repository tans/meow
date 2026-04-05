import { expect } from "vitest";
import { app } from "../app.js";

export type DemoLoginIdentifier =
  | "merchant@example.com"
  | "creator@example.com";

export const toCookieHeader = (setCookieHeader: string): string =>
  setCookieHeader
    .split(/,(?=[^;]+=[^;]+)/)
    .map((cookie) => cookie.split(";")[0]?.trim() ?? "")
    .filter((cookie) => cookie.length > 0)
    .join("; ");

export const loginAs = async (
  identifier: DemoLoginIdentifier
): Promise<string> => {
  process.env.MEOW_DEMO_AUTH = "true";

  const response = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier,
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

export const createDemoAuthCleanup = (): (() => void) => {
  const originalDemoAuth = process.env.MEOW_DEMO_AUTH;

  return () => {
    if (originalDemoAuth === undefined) {
      delete process.env.MEOW_DEMO_AUTH;
      return;
    }

    process.env.MEOW_DEMO_AUTH = originalDemoAuth;
  };
};

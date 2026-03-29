import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../lib/db.js";

const originalDemoAuth = process.env.MEOW_DEMO_AUTH;
const originalAuthMode = process.env.MEOW_AUTH_MODE;

const resetAuthEnv = (): void => {
  delete process.env.MEOW_DEMO_AUTH;
  delete process.env.MEOW_AUTH_MODE;
};

const enableDemoAuth = (): void => {
  process.env.MEOW_DEMO_AUTH = "true";
};

const login = async (input: {
  identifier: string;
  secret?: string;
  client: "web" | "miniapp" | "admin";
}): Promise<string> => {
  const response = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identifier: input.identifier,
      secret: input.secret ?? "demo-pass",
      client: input.client
    })
  });

  expect(response.status).toBe(200);
  expect(response.headers.get("set-cookie")).toContain("meow_session=");

  return response.headers.get("set-cookie") ?? "";
};

describe("admin governance routes", () => {
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
  });

  it("returns dashboard data and records task pause / resume audits", async () => {
    enableDemoAuth();

    const merchantCookie = await login({
      identifier: "merchant@example.com",
      client: "web"
    });
    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });
    expect(publishResponse.status).toBe(200);

    const ledgerEntryId = db.listLedgerEntriesByTask("task-1")[0]?.id;
    expect(ledgerEntryId).toBeDefined();

    const operatorCookie = await login({
      identifier: "operator@example.com",
      client: "admin"
    });

    const dashboard = await app.request("/admin/dashboard", {
      headers: { cookie: operatorCookie }
    });
    expect(dashboard.status).toBe(200);
    await expect(dashboard.json()).resolves.toMatchObject({
      title: "系统总览",
      metrics: expect.any(Array),
      alerts: expect.any(Array)
    });

    const paused = await app.request("/admin/tasks/task-1/pause", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: operatorCookie
      },
      body: JSON.stringify({ reason: "manual moderation" })
    });
    expect(paused.status).toBe(200);

    const resumed = await app.request("/admin/tasks/task-1/resume", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: operatorCookie
      },
      body: JSON.stringify({ reason: "issue cleared" })
    });
    expect(resumed.status).toBe(200);

    const banned = await app.request("/admin/users/creator-1/ban", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: operatorCookie
      },
      body: JSON.stringify({ reason: "manual moderation" })
    });
    expect(banned.status).toBe(200);

    const anomaly = await app.request(
      `/admin/ledger/${ledgerEntryId}/mark-anomaly`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: operatorCookie
        },
        body: JSON.stringify({ reason: "amount mismatch" })
      }
    );
    expect(anomaly.status).toBe(200);

    const ledger = await app.request("/admin/ledger", {
      headers: { cookie: operatorCookie }
    });
    expect(ledger.status).toBe(200);
    await expect(ledger.json()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "pause-task" }),
        expect.objectContaining({ action: "resume-task" }),
        expect.objectContaining({ action: "ban-user" }),
        expect.objectContaining({ action: "mark-ledger-anomaly" })
      ])
    );
  });
});

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

  it("supports admin read APIs for tasks, users and settings", async () => {
    enableDemoAuth();

    const operatorCookie = await login({
      identifier: "operator@example.com",
      client: "admin"
    });

    const tasks = await app.request("/admin/tasks?page=1&pageSize=10&keyword=task", {
      headers: { cookie: operatorCookie }
    });
    expect(tasks.status).toBe(200);
    await expect(tasks.json()).resolves.toMatchObject({
      items: expect.any(Array),
      pagination: {
        page: 1,
        pageSize: 10,
        total: expect.any(Number)
      }
    });

    const taskDetail = await app.request("/admin/tasks/task-1", {
      headers: { cookie: operatorCookie }
    });
    expect(taskDetail.status).toBe(200);
    await expect(taskDetail.json()).resolves.toMatchObject({
      id: "task-1",
      submissionStats: expect.any(Object),
      governanceActions: expect.any(Array)
    });

    const users = await app.request("/admin/users?page=1&pageSize=10&role=creator", {
      headers: { cookie: operatorCookie }
    });
    expect(users.status).toBe(200);
    await expect(users.json()).resolves.toMatchObject({
      items: expect.any(Array),
      pagination: {
        page: 1,
        pageSize: 10,
        total: expect.any(Number)
      }
    });

    const settings = await app.request("/admin/settings", {
      headers: { cookie: operatorCookie }
    });
    expect(settings.status).toBe(200);
    await expect(settings.json()).resolves.toMatchObject({
      allowTaskPublish: expect.any(Boolean),
      enableTipReward: expect.any(Boolean),
      dailyTaskRewardCap: expect.any(Number)
    });

    const updatedSettings = await app.request("/admin/settings", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie: operatorCookie
      },
      body: JSON.stringify({
        allowTaskPublish: false,
        dailyTaskRewardCap: 120
      })
    });
    expect(updatedSettings.status).toBe(200);
    await expect(updatedSettings.json()).resolves.toMatchObject({
      allowTaskPublish: false,
      dailyTaskRewardCap: 120
    });
  });
});

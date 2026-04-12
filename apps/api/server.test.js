import { afterEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApiApp } from "./server.js";

const createTestApp = async () => {
  const uploadDir = await mkdtemp(join(tmpdir(), "meow-api-test-"));
  const app = createApiApp({
    dbPath: ":memory:",
    seedDemo: true,
    demoAuthEnabled: true,
    uploadDir,
    buildTime: "2026-04-07T00:00:00.000Z",
    packageVersion: "0.1.0-test",
  });

  return {
    app,
    cleanup: async () => {
      app.close();
      await rm(uploadDir, { recursive: true, force: true });
    },
  };
};

const readJson = async (response) => response.json();

const getCookieHeader = (response) =>
  (response.headers.get("set-cookie") ?? "")
    .split(/,(?=[^;]+=[^;]+)/)
    .map((part) => part.split(";")[0]?.trim() ?? "")
    .filter(Boolean)
    .join("; ");

const loginAs = async (app, identifier, client = "web") => {
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
  return getCookieHeader(response);
};

describe("api server", () => {
  let cleanup = async () => {};

  afterEach(async () => {
    await cleanup();
  });

  it("serves health, version, and stats", async () => {
    const ctx = await createTestApp();
    cleanup = ctx.cleanup;

    const health = await ctx.app.request("/health");
    expect(health.status).toBe(200);
    await expect(readJson(health)).resolves.toMatchObject({
      ok: true,
      service: "meow-api",
      db: "ok",
    });

    const version = await ctx.app.request("/version");
    expect(version.status).toBe(200);
    await expect(readJson(version)).resolves.toEqual({
      buildTime: "2026-04-07T00:00:00.000Z",
      packageVersion: "0.1.0-test",
    });

    const stats = await ctx.app.request("/stats");
    expect(stats.status).toBe(200);
    await expect(readJson(stats)).resolves.toEqual({
      publishedTasks: 0,
      submissions: 0,
      creators: 2,
    });
  });

  it("supports auth login, session restore, and role switching", async () => {
    const ctx = await createTestApp();
    cleanup = ctx.cleanup;

    const login = await ctx.app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "hybrid@example.com",
        secret: "demo-pass",
        client: "web",
      }),
    });

    expect(login.status).toBe(200);
    await expect(readJson(login)).resolves.toMatchObject({
      userId: "hybrid-1",
      activeRole: "creator",
      roles: ["creator", "merchant"],
    });

    const cookie = getCookieHeader(login);
    expect(cookie).toContain("meow_session=");

    const session = await ctx.app.request("/auth/session", {
      headers: { cookie },
    });

    expect(session.status).toBe(200);
    await expect(readJson(session)).resolves.toMatchObject({
      userId: "hybrid-1",
      activeRole: "creator",
      roles: ["creator", "merchant"],
    });

    const switched = await ctx.app.request("/auth/switch-role", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ role: "merchant" }),
    });

    expect(switched.status).toBe(200);
    await expect(readJson(switched)).resolves.toMatchObject({
      userId: "hybrid-1",
      activeRole: "merchant",
      roles: ["creator", "merchant"],
    });
  });

  it("supports merchant publish flow, creator submissions, rewards, and settlement", async () => {
    const ctx = await createTestApp();
    cleanup = ctx.cleanup;

    const merchantCookie = await loginAs(ctx.app, "merchant@example.com");
    const creatorCookie = await loginAs(ctx.app, "creator@example.com");

    const formData = new FormData();
    formData.append("files", new File(["fake-image"], "brief.png", { type: "image/png" }));
    formData.append("files", new File(["fake-video"], "brief.mp4", { type: "video/mp4" }));

    const upload = await ctx.app.request("/merchant/uploads", {
      method: "POST",
      headers: { cookie: merchantCookie },
      body: formData,
    });

    expect(upload.status).toBe(201);
    const uploaded = await readJson(upload);
    expect(uploaded.attachments).toHaveLength(2);

    const createTask = await ctx.app.request("/merchant/tasks", {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: "夏日探店需求",
        assetAttachments: uploaded.attachments,
      }),
    });

    expect(createTask.status).toBe(201);
    const { taskId } = await readJson(createTask);
    expect(taskId).toContain("task-");

    const publish = await ctx.app.request(`/merchant/tasks/${taskId}/publish`, {
      method: "POST",
      headers: { cookie: merchantCookie },
    });

    expect(publish.status).toBe(200);
    await expect(readJson(publish)).resolves.toMatchObject({
      id: taskId,
      merchantId: "merchant-1",
      status: "published",
      ledgerEffect: "merchant_escrow_locked",
    });

    const taskDetail = await ctx.app.request(`/merchant/tasks/${taskId}`, {
      headers: { cookie: merchantCookie },
    });
    expect(taskDetail.status).toBe(200);
    await expect(readJson(taskDetail)).resolves.toMatchObject({
      id: taskId,
      title: "夏日探店需求",
      assetAttachments: [
        expect.objectContaining({ fileName: "brief.png", kind: "image" }),
        expect.objectContaining({ fileName: "brief.mp4", kind: "video" }),
      ],
    });

    const submission = await ctx.app.request(`/creator/tasks/${taskId}/submissions`, {
      method: "POST",
      headers: {
        cookie: creatorCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/cut-1.mp4",
        description: "cut 1",
      }),
    });

    expect(submission.status).toBe(201);
    const createdSubmission = await readJson(submission);
    expect(createdSubmission).toMatchObject({
      taskId,
      creatorId: "creator-1",
      status: "submitted",
    });

    const review = await ctx.app.request(`/merchant/submissions/${createdSubmission.id}/review`, {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ approved: true }),
    });
    expect(review.status).toBe(200);

    const tip = await ctx.app.request(`/merchant/submissions/${createdSubmission.id}/tips`, {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ amount: 1 }),
    });
    expect(tip.status).toBe(201);

    const ranking = await ctx.app.request(`/merchant/tasks/${taskId}/rewards/ranking`, {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        submissionId: createdSubmission.id,
        amount: 1,
      }),
    });
    expect(ranking.status).toBe(201);

    const settle = await ctx.app.request(`/merchant/tasks/${taskId}/settle`, {
      method: "POST",
      headers: { cookie: merchantCookie },
    });

    expect(settle.status).toBe(200);
    await expect(readJson(settle)).resolves.toMatchObject({
      taskId,
      status: "settled",
      creatorAvailableDelta: 3,
      merchantRefundDelta: 2,
    });

    // Paginated creator submissions list
    const submissionsList = await ctx.app.request("/creator/submissions?page=1&pageSize=10", {
      headers: { cookie: creatorCookie },
    });
    expect(submissionsList.status).toBe(200);
    await expect(readJson(submissionsList)).resolves.toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ taskId })]),
      pagination: { page: 1, pageSize: 10, total: expect.any(Number) },
    });

    // Paginated per-task submissions for merchant
    const taskSubmissions = await ctx.app.request(`/merchant/tasks/${taskId}/submissions?page=1&pageSize=20`, {
      headers: { cookie: merchantCookie },
    });
    expect(taskSubmissions.status).toBe(200);
    await expect(readJson(taskSubmissions)).resolves.toMatchObject({
      items: expect.any(Array),
      pagination: { page: 1, pageSize: 20, total: expect.any(Number) },
    });

    const creatorWallet = await ctx.app.request("/creator/wallet", {
      headers: { cookie: creatorCookie },
    });
    expect(creatorWallet.status).toBe(200);
    await expect(readJson(creatorWallet)).resolves.toMatchObject({
      creatorId: "creator-1",
      availableAmount: 3,
    });

    const merchantWallet = await ctx.app.request("/merchant/wallet", {
      headers: { cookie: merchantCookie },
    });
    expect(merchantWallet.status).toBe(200);
    await expect(readJson(merchantWallet)).resolves.toMatchObject({
      merchantId: "merchant-1",
      tipSpentAmount: 1,
    });
  });

  it("supports admin governance and read models", async () => {
    const ctx = await createTestApp();
    cleanup = ctx.cleanup;

    const merchantCookie = await loginAs(ctx.app, "merchant@example.com");
    const operatorCookie = await loginAs(ctx.app, "operator@example.com", "admin");

    const publish = await ctx.app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie },
    });
    expect(publish.status).toBe(200);

    const dashboard = await ctx.app.request("/admin/dashboard", {
      headers: { cookie: operatorCookie },
    });
    expect(dashboard.status).toBe(200);
    await expect(readJson(dashboard)).resolves.toMatchObject({
      activeTasks: expect.any(Number),
      submissionsToday: expect.any(Number),
      frozenAmount: expect.any(Number),
    });

    const pause = await ctx.app.request("/admin/tasks/task-1/pause", {
      method: "POST",
      headers: {
        cookie: operatorCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ reason: "manual moderation" }),
    });
    expect(pause.status).toBe(200);

    const resume = await ctx.app.request("/admin/tasks/task-1/resume", {
      method: "POST",
      headers: {
        cookie: operatorCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ reason: "issue cleared" }),
    });
    expect(resume.status).toBe(200);

    const users = await ctx.app.request("/admin/users?page=1&pageSize=10&role=creator", {
      headers: { cookie: operatorCookie },
    });
    expect(users.status).toBe(200);
    await expect(readJson(users)).resolves.toMatchObject({
      items: expect.any(Array),
      pagination: { page: 1, pageSize: 10, total: expect.any(Number) },
    });

    const settings = await ctx.app.request("/admin/settings", {
      headers: { cookie: operatorCookie },
    });
    expect(settings.status).toBe(200);

    const updateSettings = await ctx.app.request("/admin/settings", {
      method: "PUT",
      headers: {
        cookie: operatorCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        allowTaskPublish: false,
      }),
    });
    expect(updateSettings.status).toBe(200);

    const ledger = await ctx.app.request("/admin/ledger", {
      headers: { cookie: operatorCookie },
    });
    expect(ledger.status).toBe(200);
    await expect(readJson(ledger)).resolves.toMatchObject({
      items: expect.any(Array),
      pagination: {
        page: 1,
        pageSize: 20,
        total: expect.any(Number),
      },
    });
  });
});

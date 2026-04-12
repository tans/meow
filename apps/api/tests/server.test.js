import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;

const login = async (app, identifier, client = "web") => {
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
  return response.headers.get("set-cookie") ?? "";
};

describe("bun api server", () => {
  let uploadDir;

  beforeEach(() => {
    uploadDir = mkdtempSync(join(tmpdir(), "meow-api-test-"));
    process.env.NODE_ENV = "test";
    process.env.MEOW_DEMO_AUTH = "true";
    process.env.MEOW_UPLOAD_DIR = uploadDir;
  });

  afterEach(() => {
    rmSync(uploadDir, { recursive: true, force: true });
    delete process.env.MEOW_DEMO_AUTH;
    delete process.env.MEOW_UPLOAD_DIR;
    delete process.env.NODE_ENV;
  });

  test("supports health and auth session flow", async () => {
    const { createApp } = await import("../app.js");
    const app = createApp();

    const health = await app.request("/health");
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({
      ok: true,
      service: "meow-api",
    });

    const loginResponse = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "hybrid@example.com",
        secret: "demo-pass",
        client: "web",
      }),
    });

    expect(loginResponse.status).toBe(200);
    const cookie = loginResponse.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("meow_session=");

    const session = await app.request("/auth/session", {
      headers: { cookie },
    });

    expect(session.status).toBe(200);
    expect(await session.json()).toMatchObject({
      userId: "hybrid-1",
      activeRole: "creator",
      roles: ["creator", "merchant"],
    });

    const switchRole = await app.request("/auth/switch-role", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ role: "merchant" }),
    });

    expect(switchRole.status).toBe(200);
    expect(await switchRole.json()).toMatchObject({
      userId: "hybrid-1",
      activeRole: "merchant",
    });
  });

  test("supports merchant creator admin end-to-end flow", async () => {
    const { createApp } = await import("../app.js");
    const app = createApp();
    const merchantCookie = await login(app, "merchant@example.com");
    const creatorCookie = await login(app, "creator@example.com");
    const operatorCookie = await login(app, "operator@example.com", "admin");

    const uploadForm = new FormData();
    uploadForm.append("files", new File(["image-bytes"], "brief.png", { type: "image/png" }));
    uploadForm.append("files", new File(["video-bytes"], "brief.mp4", { type: "video/mp4" }));

    const upload = await app.request("/merchant/uploads", {
      method: "POST",
      headers: { cookie: merchantCookie },
      body: uploadForm,
    });

    expect(upload.status).toBe(201);
    const uploaded = await upload.json();
    expect(uploaded.attachments).toHaveLength(2);

    const createTask = await app.request("/merchant/tasks", {
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
    const draft = await createTask.json();
    expect(draft.status).toBe("draft");

    const publish = await app.request(`/merchant/tasks/${draft.taskId}/publish`, {
      method: "POST",
      headers: { cookie: merchantCookie },
    });

    expect(publish.status).toBe(200);

    const creatorFeed = await app.request("/creator/tasks", {
      headers: { cookie: creatorCookie },
    });

    expect(creatorFeed.status).toBe(200);
    expect(await creatorFeed.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: draft.taskId,
          title: "夏日探店需求",
          status: "published",
        }),
      ]),
    );

    const submit = await app.request(`/creator/tasks/${draft.taskId}/submissions`, {
      method: "POST",
      headers: {
        cookie: creatorCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/work.mp4",
        description: "第一版作品",
      }),
    });

    expect(submit.status).toBe(201);
    const submission = await submit.json();

    const review = await app.request(`/merchant/submissions/${submission.id}/review`, {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ approved: true }),
    });

    expect(review.status).toBe(200);

    const tip = await app.request(`/merchant/submissions/${submission.id}/tips`, {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ amount: 2 }),
    });

    expect(tip.status).toBe(201);

    const ranking = await app.request(`/merchant/tasks/${draft.taskId}/rewards/ranking`, {
      method: "POST",
      headers: {
        cookie: merchantCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        submissionId: submission.id,
        amount: 3,
      }),
    });

    expect(ranking.status).toBe(201);

    const creatorWalletBefore = await app.request("/creator/wallet", {
      headers: { cookie: creatorCookie },
    });

    expect(creatorWalletBefore.status).toBe(200);
    expect(await creatorWalletBefore.json()).toMatchObject({
      creatorId: "creator-1",
      frozenAmount: 6,
      availableAmount: 0,
      submissionCount: 1,
    });

    const merchantWalletBefore = await app.request("/merchant/wallet", {
      headers: { cookie: merchantCookie },
    });

    expect(merchantWalletBefore.status).toBe(200);
    expect(await merchantWalletBefore.json()).toMatchObject({
      merchantId: "merchant-1",
      tipSpentAmount: 2,
    });

    const settle = await app.request(`/merchant/tasks/${draft.taskId}/settle`, {
      method: "POST",
      headers: { cookie: merchantCookie },
    });

    expect(settle.status).toBe(200);
    expect(await settle.json()).toMatchObject({
      taskId: draft.taskId,
      status: "settled",
      creatorAvailableDelta: 6,
    });

    const creatorWalletAfter = await app.request("/creator/wallet", {
      headers: { cookie: creatorCookie },
    });

    expect(creatorWalletAfter.status).toBe(200);
    expect(await creatorWalletAfter.json()).toMatchObject({
      creatorId: "creator-1",
      frozenAmount: 0,
      availableAmount: 6,
    });

    const dashboard = await app.request("/admin/dashboard", {
      headers: { cookie: operatorCookie },
    });

    expect(dashboard.status).toBe(200);
    expect(await dashboard.json()).toMatchObject({
      activeTasks: expect.any(Number),
      submissionsToday: expect.any(Number),
      frozenAmount: expect.any(Number),
    });
  });

  describe("upload validation", () => {
    test("rejects upload requests with no files", async () => {
      const { createApp } = await import("../app.js");
      const app = createApp();
      const merchantCookie = await login(app, "merchant@example.com");
      const uploadForm = new FormData();

      const upload = await app.request("/merchant/uploads", {
        method: "POST",
        headers: { cookie: merchantCookie },
        body: uploadForm,
      });

      expect(upload.status).toBe(400);
      expect(await upload.json()).toEqual({
        error: "missing upload files",
        status: 400,
      });
    });

    test("rejects upload files that exceed the size limit", async () => {
      const { createApp } = await import("../app.js");
      const app = createApp();
      const merchantCookie = await login(app, "merchant@example.com");
      const uploadForm = new FormData();
      uploadForm.append(
        "files",
        new File([new Uint8Array(MAX_UPLOAD_FILE_BYTES + 1)], "too-large.mp4", {
          type: "video/mp4",
        }),
      );

      const upload = await app.request("/merchant/uploads", {
        method: "POST",
        headers: { cookie: merchantCookie },
        body: uploadForm,
      });

      expect(upload.status).toBe(413);
      expect(await upload.json()).toEqual({
        error: "upload file too large",
        status: 413,
      });
    });
  });
});

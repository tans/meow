import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createTestContext, loginAs } from "./helpers.js";

describe("rewards, settlement, and admin governance", () => {
  let testContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  afterEach(() => {
    testContext.cleanup();
  });

  it("moves rewards through approval, ranking, settlement, and wallet snapshots", async () => {
    const merchantCookie = await loginAs(testContext.app, "merchant@example.com");
    const creatorCookie = await loginAs(testContext.app, "creator@example.com");

    const publishResponse = await testContext.app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie },
    });
    expect(publishResponse.status).toBe(200);

    const submissionResponse = await testContext.app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie,
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/native.mp4",
        description: "native miniapp",
      }),
    });
    expect(submissionResponse.status).toBe(201);
    const submission = await submissionResponse.json();

    const reviewResponse = await testContext.app.request(`/merchant/submissions/${submission.id}/review`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: merchantCookie,
      },
      body: JSON.stringify({ approved: true }),
    });
    expect(reviewResponse.status).toBe(200);

    const tipResponse = await testContext.app.request(`/merchant/submissions/${submission.id}/tips`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: merchantCookie,
      },
      body: JSON.stringify({ amount: 1 }),
    });
    expect(tipResponse.status).toBe(201);

    const rankingResponse = await testContext.app.request("/merchant/tasks/task-1/rewards/ranking", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: merchantCookie,
      },
      body: JSON.stringify({ submissionId: submission.id, amount: 1 }),
    });
    expect(rankingResponse.status).toBe(201);

    const creatorWalletBeforeSettlement = await testContext.app.request("/creator/wallet", {
      headers: { cookie: creatorCookie },
    });
    expect(creatorWalletBeforeSettlement.status).toBe(200);
    expect(await creatorWalletBeforeSettlement.json()).toMatchObject({
      creatorId: "creator-1",
      frozenAmount: 3,
      availableAmount: 0,
      submissionCount: 1,
    });

    const settleResponse = await testContext.app.request("/merchant/tasks/task-1/settle", {
      method: "POST",
      headers: { cookie: merchantCookie },
    });
    expect(settleResponse.status).toBe(200);
    expect(await settleResponse.json()).toMatchObject({
      taskId: "task-1",
      status: "settled",
      creatorAvailableDelta: 3,
      merchantRefundDelta: 1,
    });

    const merchantWallet = await testContext.app.request("/merchant/wallet", {
      headers: { cookie: merchantCookie },
    });
    expect(merchantWallet.status).toBe(200);
    expect(await merchantWallet.json()).toMatchObject({
      merchantId: "merchant-1",
      escrowAmount: 0,
      refundableAmount: 0,
      tipSpentAmount: 1,
    });

    const creatorWalletAfterSettlement = await testContext.app.request("/creator/wallet", {
      headers: { cookie: creatorCookie },
    });
    expect(creatorWalletAfterSettlement.status).toBe(200);
    expect(await creatorWalletAfterSettlement.json()).toMatchObject({
      creatorId: "creator-1",
      frozenAmount: 0,
      availableAmount: 3,
      submissionCount: 1,
    });
  });

  it("supports admin dashboard, governance actions, and read apis", async () => {
    const merchantCookie = await loginAs(testContext.app, "merchant@example.com");
    const operatorCookie = await loginAs(testContext.app, "operator@example.com", "admin");

    const publishResponse = await testContext.app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie },
    });
    expect(publishResponse.status).toBe(200);

    const dashboard = await testContext.app.request("/admin/dashboard", {
      headers: { cookie: operatorCookie },
    });
    expect(dashboard.status).toBe(200);
    expect(await dashboard.json()).toMatchObject({
      activeTasks: expect.any(Number),
      submissionsToday: expect.any(Number),
      frozenAmount: expect.any(Number),
    });

    const tasks = await testContext.app.request("/admin/tasks?page=1&pageSize=10&status=published", {
      headers: { cookie: operatorCookie },
    });
    expect(tasks.status).toBe(200);
    expect(await tasks.json()).toMatchObject({
      items: expect.any(Array),
      pagination: expect.objectContaining({ page: 1, pageSize: 10 }),
    });

    const taskDetail = await testContext.app.request("/admin/tasks/task-1", {
      headers: { cookie: operatorCookie },
    });
    expect(taskDetail.status).toBe(200);

    const users = await testContext.app.request("/admin/users?page=1&pageSize=10&role=creator", {
      headers: { cookie: operatorCookie },
    });
    expect(users.status).toBe(200);

    const settings = await testContext.app.request("/admin/settings", {
      headers: { cookie: operatorCookie },
    });
    expect(settings.status).toBe(200);

    const updatedSettings = await testContext.app.request("/admin/settings", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie: operatorCookie,
      },
      body: JSON.stringify({ dailyTaskRewardCap: 120 }),
    });
    expect(updatedSettings.status).toBe(200);

    const pauseResponse = await testContext.app.request("/admin/tasks/task-1/pause", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: operatorCookie,
      },
      body: JSON.stringify({ reason: "manual moderation" }),
    });
    expect(pauseResponse.status).toBe(200);

    const resumeResponse = await testContext.app.request("/admin/tasks/task-1/resume", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: operatorCookie,
      },
      body: JSON.stringify({ reason: "issue cleared" }),
    });
    expect(resumeResponse.status).toBe(200);

    const banResponse = await testContext.app.request("/admin/users/creator-1/ban", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: operatorCookie,
      },
      body: JSON.stringify({ reason: "manual moderation" }),
    });
    expect(banResponse.status).toBe(200);

    const ledger = await testContext.app.request("/admin/ledger", {
      headers: { cookie: operatorCookie },
    });
    expect(ledger.status).toBe(200);
    expect(await ledger.json()).toMatchObject({
      items: expect.any(Array),
      pagination: expect.objectContaining({ page: 1 }),
    });
  });
});

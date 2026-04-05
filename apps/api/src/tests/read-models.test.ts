import { afterAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { createDemoAuthCleanup, loginAs } from "./helpers.js";

describe("api read models for native miniapp", () => {
  afterAll(createDemoAuthCleanup());

  it("exposes merchant task, creator task detail, submission, and wallet snapshots", async () => {
    const merchantCookie = await loginAs("merchant@example.com");
    const creatorCookie = await loginAs("creator@example.com");

    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(publishResponse.status).toBe(200);

    const submissionResponse = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/native.mp4",
        description: "native miniapp"
      })
    });

    expect(submissionResponse.status).toBe(201);
    const submission = (await submissionResponse.json()) as { id: string };

    const creatorTaskSubmissionsBeforeReview = await app.request(
      "/creator/tasks/task-1/submissions",
      {
        headers: { cookie: creatorCookie }
      }
    );

    expect(creatorTaskSubmissionsBeforeReview.status).toBe(200);
    await expect(creatorTaskSubmissionsBeforeReview.json()).resolves.toEqual([
      expect.objectContaining({
        id: submission.id,
        taskId: "task-1",
        status: "submitted",
        rewardTags: []
      })
    ]);

    const merchantTasksResponse = await app.request("/merchant/tasks", {
      headers: { cookie: merchantCookie }
    });

    expect(merchantTasksResponse.status).toBe(200);
    await expect(merchantTasksResponse.json()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "task-1",
          status: "published",
          escrowLockedAmount: 3,
          submissionCount: 1
        })
      ])
    );

    const merchantTaskDetailResponse = await app.request("/merchant/tasks/task-1", {
      headers: { cookie: merchantCookie }
    });

    expect(merchantTaskDetailResponse.status).toBe(200);
    await expect(merchantTaskDetailResponse.json()).resolves.toMatchObject({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      escrowLockedAmount: 3,
      submissionCount: 1
    });

    const creatorTaskDetailResponse = await app.request("/creator/tasks/task-1", {
      headers: { cookie: creatorCookie }
    });

    expect(creatorTaskDetailResponse.status).toBe(200);
    await expect(creatorTaskDetailResponse.json()).resolves.toMatchObject({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      creatorSubmissionCount: 1
    });

    const merchantSubmissionsResponse = await app.request(
      "/merchant/tasks/task-1/submissions",
      {
        headers: { cookie: merchantCookie }
      }
    );

    expect(merchantSubmissionsResponse.status).toBe(200);
    await expect(merchantSubmissionsResponse.json()).resolves.toEqual([
      expect.objectContaining({
        id: submission.id,
        taskId: "task-1",
        status: "submitted",
        rewardTags: []
      })
    ]);

    const reviewResponse = await app.request(
      `/merchant/submissions/${submission.id}/review`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: merchantCookie
        },
        body: JSON.stringify({ decision: "approved" })
      }
    );

    expect(reviewResponse.status).toBe(200);

    const tipResponse = await app.request(`/merchant/submissions/${submission.id}/tips`, {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(tipResponse.status).toBe(201);
    const secondTipResponse = await app.request(
      `/merchant/submissions/${submission.id}/tips`,
      {
        method: "POST",
        headers: { cookie: merchantCookie }
      }
    );

    expect(secondTipResponse.status).toBe(201);

    const rankingResponse = await app.request("/merchant/tasks/task-1/rewards/ranking", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: merchantCookie
      },
      body: JSON.stringify({ submissionId: submission.id })
    });

    expect(rankingResponse.status).toBe(201);

    const creatorTaskSubmissionsAfterRewards = await app.request(
      "/creator/tasks/task-1/submissions",
      {
        headers: { cookie: creatorCookie }
      }
    );

    expect(creatorTaskSubmissionsAfterRewards.status).toBe(200);
    await expect(creatorTaskSubmissionsAfterRewards.json()).resolves.toEqual([
      expect.objectContaining({
        id: submission.id,
        taskId: "task-1",
        status: "approved",
        rewardTags: ["base", "tip", "ranking"]
      })
    ]);

    const merchantWalletBeforeSettlement = await app.request("/merchant/wallet", {
      headers: { cookie: merchantCookie }
    });

    expect(merchantWalletBeforeSettlement.status).toBe(200);
    await expect(merchantWalletBeforeSettlement.json()).resolves.toMatchObject({
      merchantId: "merchant-1",
      escrowAmount: 3,
      refundableAmount: 1,
      tipSpentAmount: 2,
      publishedTaskCount: 1
    });

    const creatorSubmissionsResponse = await app.request("/creator/submissions", {
      headers: { cookie: creatorCookie }
    });

    expect(creatorSubmissionsResponse.status).toBe(200);
    await expect(creatorSubmissionsResponse.json()).resolves.toEqual([
      expect.objectContaining({
        id: submission.id,
        status: "approved",
        rewardTags: ["base", "tip", "ranking"]
      })
    ]);

    const creatorWalletBeforeSettlement = await app.request("/creator/wallet", {
      headers: { cookie: creatorCookie }
    });

    expect(creatorWalletBeforeSettlement.status).toBe(200);
    await expect(creatorWalletBeforeSettlement.json()).resolves.toMatchObject({
      creatorId: "creator-1",
      frozenAmount: 4,
      availableAmount: 0,
      submissionCount: 1
    });

    const settleResponse = await app.request("/merchant/tasks/task-1/settle", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(settleResponse.status).toBe(200);

    const creatorWalletAfterSettlement = await app.request("/creator/wallet", {
      headers: { cookie: creatorCookie }
    });

    expect(creatorWalletAfterSettlement.status).toBe(200);
    await expect(creatorWalletAfterSettlement.json()).resolves.toMatchObject({
      creatorId: "creator-1",
      frozenAmount: 0,
      availableAmount: 4,
      submissionCount: 1
    });

    const merchantWalletAfterSettlement = await app.request("/merchant/wallet", {
      headers: { cookie: merchantCookie }
    });

    expect(merchantWalletAfterSettlement.status).toBe(200);
    await expect(merchantWalletAfterSettlement.json()).resolves.toMatchObject({
      merchantId: "merchant-1",
      escrowAmount: 0,
      refundableAmount: 0,
      tipSpentAmount: 2,
      publishedTaskCount: 1
    });
  });
});

import { describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../lib/db.js";

describe("merchant settlement flow", () => {
  it("moves approved rewards to creator available balance and refunds unused escrow", async () => {
    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { "x-demo-user": "merchant-1" }
    });

    expect(publishResponse.status).toBe(200);

    const submissionResponse = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-demo-user": "creator-1"
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/review.mp4",
        description: "candidate"
      })
    });

    expect(submissionResponse.status).toBe(201);
    const submission = (await submissionResponse.json()) as { id: string };

    const reviewResponse = await app.request(
      `/merchant/submissions/${submission.id}/review`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-demo-user": "merchant-1"
        },
        body: JSON.stringify({ decision: "approved" })
      }
    );

    expect(reviewResponse.status).toBe(200);

    const tipResponse = await app.request(`/merchant/submissions/${submission.id}/tips`, {
      method: "POST",
      headers: { "x-demo-user": "merchant-1" }
    });

    expect(tipResponse.status).toBe(201);

    const rankingResponse = await app.request("/merchant/tasks/task-1/rewards/ranking", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-demo-user": "merchant-1"
      },
      body: JSON.stringify({ submissionId: submission.id })
    });

    expect(rankingResponse.status).toBe(201);

    const response = await app.request("/merchant/tasks/task-1/settle", {
      method: "POST",
      headers: { "x-demo-user": "merchant-1" }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      taskId: "task-1",
      status: "settled",
      creatorAvailableDelta: 3,
      merchantRefundDelta: 1
    });

    expect(db.getTask("task-1")).toMatchObject({
      id: "task-1",
      status: "settled"
    });

    expect(db.listRewardsByTask("task-1")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "base", status: "available" }),
        expect.objectContaining({ type: "tip", status: "available" }),
        expect.objectContaining({ type: "ranking", status: "available" })
      ])
    );

    expect(db.listLedgerEntriesByTask("task-1")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          account: "creator_available",
          amount: 3,
          direction: "credit"
        }),
        expect.objectContaining({
          account: "merchant_balance",
          amount: 1,
          direction: "credit"
        })
      ])
    );
  });
});

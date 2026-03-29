import { afterAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../lib/db.js";

const originalDemoAuth = process.env.MEOW_DEMO_AUTH;

const loginAs = async (
  identifier: "merchant@example.com" | "creator@example.com"
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

  return response.headers.get("set-cookie") ?? "";
};

describe("merchant settlement flow", () => {
  afterAll(() => {
    if (originalDemoAuth === undefined) {
      delete process.env.MEOW_DEMO_AUTH;
      return;
    }

    process.env.MEOW_DEMO_AUTH = originalDemoAuth;
  });

  it("moves approved rewards to creator available balance and refunds unused escrow", async () => {
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

    const rankingResponse = await app.request("/merchant/tasks/task-1/rewards/ranking", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: merchantCookie
      },
      body: JSON.stringify({ submissionId: submission.id })
    });

    expect(rankingResponse.status).toBe(201);

    const response = await app.request("/merchant/tasks/task-1/settle", {
      method: "POST",
      headers: { cookie: merchantCookie }
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

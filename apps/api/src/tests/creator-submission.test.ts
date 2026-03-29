import { afterAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../lib/db.js";

const originalDemoAuth = process.env.MEOW_DEMO_AUTH;

const toCookieHeader = (setCookieHeader: string): string =>
  setCookieHeader
    .split(/,(?=[^;]+=[^;]+)/)
    .map((cookie) => cookie.split(";")[0]?.trim() ?? "")
    .filter((cookie) => cookie.length > 0)
    .join("; ");

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
  const setCookieHeader = response.headers.get("set-cookie") ?? "";
  const cookieHeader = toCookieHeader(setCookieHeader);
  expect(cookieHeader).toContain("meow_session=");

  return cookieHeader;
};

describe("creator submission flow", () => {
  afterAll(() => {
    if (originalDemoAuth === undefined) {
      delete process.env.MEOW_DEMO_AUTH;
      return;
    }

    process.env.MEOW_DEMO_AUTH = originalDemoAuth;
  });

  it("creates a submitted record for a published task", async () => {
    const merchantCookie = await loginAs("merchant@example.com");
    const creatorCookie = await loginAs("creator@example.com");

    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(publishResponse.status).toBe(200);

    const response = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/a.mp4",
        description: "cut 1"
      })
    });

    expect(response.status).toBe(201);
    const submission = (await response.json()) as {
      id: string;
      taskId: string;
      creatorId: string;
      assetUrl: string;
      description: string;
      status: string;
    };

    expect(submission).toMatchObject({
      taskId: "task-1",
      creatorId: "creator-1",
      status: "submitted"
    });
    expect(db.getSubmission(submission.id)).toEqual(submission);
  });

  it("rejects submissions for draft tasks", async () => {
    const merchantCookie = await loginAs("merchant@example.com");
    const creatorCookie = await loginAs("creator@example.com");

    const draftResponse = await app.request("/merchant/tasks", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(draftResponse.status).toBe(201);
    const draftTask = (await draftResponse.json()) as { taskId: string };

    const response = await app.request(
      `/creator/tasks/${draftTask.taskId}/submissions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: creatorCookie
        },
        body: JSON.stringify({
          assetUrl: "https://example.com/draft.mp4",
          description: "should fail"
        })
      }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "task is not published"
    });
  });

  it("rejects malformed submission json", async () => {
    const merchantCookie = await loginAs("merchant@example.com");
    const creatorCookie = await loginAs("creator@example.com");

    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(publishResponse.status).toBe(200);

    const response = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie
      },
      body: '{"assetUrl":"https://example.com/bad.mp4"'
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid submission json"
    });
  });

  it("rejects invalid submission fields", async () => {
    const merchantCookie = await loginAs("merchant@example.com");
    const creatorCookie = await loginAs("creator@example.com");

    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(publishResponse.status).toBe(200);

    const response = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie
      },
      body: JSON.stringify({
        assetUrl: "",
        description: 123
      })
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid submission input"
    });
  });

  it("updates and withdraws a submitted creator submission", async () => {
    const merchantCookie = await loginAs("merchant@example.com");
    const creatorCookie = await loginAs("creator@example.com");

    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(publishResponse.status).toBe(200);

    const createResponse = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/original.mp4",
        description: "first draft"
      })
    });

    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string };

    const updateResponse = await app.request(
      `/creator/submissions/${created.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: creatorCookie
        },
        body: JSON.stringify({
          assetUrl: "https://example.com/edited.mp4",
          description: "edited draft"
        })
      }
    );

    expect(updateResponse.status).toBe(200);
    await expect(updateResponse.json()).resolves.toMatchObject({
      id: created.id,
      assetUrl: "https://example.com/edited.mp4",
      description: "edited draft",
      status: "submitted"
    });

    const withdrawResponse = await app.request(
      `/creator/submissions/${created.id}/withdraw`,
      {
        method: "POST",
        headers: {
          cookie: creatorCookie
        }
      }
    );

    expect(withdrawResponse.status).toBe(200);
    await expect(withdrawResponse.json()).resolves.toEqual({
      submissionId: created.id,
      status: "withdrawn"
    });

    expect(db.getSubmission(created.id)).toMatchObject({
      id: created.id,
      assetUrl: "https://example.com/edited.mp4",
      description: "edited draft",
      status: "withdrawn"
    });
  });

  it("rejects merchant review actions for withdrawn submissions", async () => {
    const merchantCookie = await loginAs("merchant@example.com");
    const creatorCookie = await loginAs("creator@example.com");

    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(publishResponse.status).toBe(200);

    const createResponse = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: creatorCookie
      },
      body: JSON.stringify({
        assetUrl: "https://example.com/withdraw.mp4",
        description: "withdraw me"
      })
    });

    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string };

    const withdrawResponse = await app.request(
      `/creator/submissions/${created.id}/withdraw`,
      {
        method: "POST",
        headers: {
          cookie: creatorCookie
        }
      }
    );

    expect(withdrawResponse.status).toBe(200);

    const merchantListResponse = await app.request(
      "/merchant/tasks/task-1/submissions",
      {
        headers: { cookie: merchantCookie }
      }
    );

    expect(merchantListResponse.status).toBe(200);
    await expect(merchantListResponse.json()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          status: "withdrawn",
          rewardTags: []
        })
      ])
    );

    const reviewResponse = await app.request(
      `/merchant/submissions/${created.id}/review`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: merchantCookie
        },
        body: JSON.stringify({ decision: "approved" })
      }
    );

    expect(reviewResponse.status).toBe(403);
    await expect(reviewResponse.json()).resolves.toEqual({
      error: "submission is withdrawn"
    });

    const tipResponse = await app.request(`/merchant/submissions/${created.id}/tips`, {
      method: "POST",
      headers: { cookie: merchantCookie }
    });

    expect(tipResponse.status).toBe(403);
    await expect(tipResponse.json()).resolves.toEqual({
      error: "submission is withdrawn"
    });

    const rankingResponse = await app.request("/merchant/tasks/task-1/rewards/ranking", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: merchantCookie
      },
      body: JSON.stringify({ submissionId: created.id })
    });

    expect(rankingResponse.status).toBe(403);
    await expect(rankingResponse.json()).resolves.toEqual({
      error: "submission is withdrawn"
    });
  });
});

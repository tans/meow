import { describe, expect, it } from "vitest";
import { app } from "../app.js";
import { db } from "../lib/db.js";

describe("creator submission flow", () => {
  it("creates a submitted record for a published task", async () => {
    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { "x-demo-user": "merchant-1" }
    });

    expect(publishResponse.status).toBe(200);

    const response = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-demo-user": "creator-1"
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
    const draftResponse = await app.request("/merchant/tasks", {
      method: "POST",
      headers: { "x-demo-user": "merchant-1" }
    });

    expect(draftResponse.status).toBe(201);
    const draftTask = (await draftResponse.json()) as { taskId: string };

    const response = await app.request(
      `/creator/tasks/${draftTask.taskId}/submissions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-demo-user": "creator-1"
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
    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { "x-demo-user": "merchant-1" }
    });

    expect(publishResponse.status).toBe(200);

    const response = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-demo-user": "creator-1"
      },
      body: '{"assetUrl":"https://example.com/bad.mp4"'
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid submission json"
    });
  });

  it("rejects invalid submission fields", async () => {
    const publishResponse = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { "x-demo-user": "merchant-1" }
    });

    expect(publishResponse.status).toBe(200);

    const response = await app.request("/creator/tasks/task-1/submissions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-demo-user": "creator-1"
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
});

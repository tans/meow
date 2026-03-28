import { describe, expect, it } from "vitest";
import { app } from "../app.js";

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
    await expect(response.json()).resolves.toMatchObject({
      taskId: "task-1",
      creatorId: "creator-1",
      status: "submitted"
    });
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
});

import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("creator submission flow", () => {
  it("creates a submitted record for a published task", async () => {
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
});

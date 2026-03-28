import { describe, expect, it } from "vitest";
import { mapTaskCard } from "../view-models/task-feed.js";

describe("task feed cards", () => {
  it("shows status and reward summary for public tasks", () => {
    expect(
      mapTaskCard({
        id: "task-1",
        title: "短视频任务",
        status: "published",
        rewardText: "基础奖+排名奖"
      })
    ).toMatchObject({
      id: "task-1",
      badge: "进行中"
    });
  });
});

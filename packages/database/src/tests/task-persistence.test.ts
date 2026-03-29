import { describe, expect, it } from "vitest";
import { createTestDb } from "../test-db.js";

describe("task persistence repository", () => {
  it("persists task, submission, and reward records in sqlite", async () => {
    const db = await createTestDb();
    const seeded = await db.seedDemo();

    const draft = db.repository.createTaskDraft(seeded.merchant.id);
    expect(draft.status).toBe("draft");

    db.repository.saveTask({
      ...draft,
      status: "published",
      escrowLockedAmount: 3
    });

    const publishedTask = db.repository.getTask(draft.id);
    expect(publishedTask).toMatchObject({
      id: draft.id,
      status: "published",
      escrowLockedAmount: 3
    });

    const submission = db.repository.saveSubmission({
      id: "submission-task-persistence-1",
      taskId: draft.id,
      creatorId: seeded.creator.id,
      assetUrl: "https://example.com/demo.mp4",
      description: "demo submission",
      status: "submitted"
    });

    const reward = db.repository.createReward({
      taskId: draft.id,
      submissionId: submission.id,
      creatorId: seeded.creator.id,
      type: "base",
      amount: 1,
      status: "frozen"
    });

    expect(db.repository.getSubmission(submission.id)).toEqual(submission);
    expect(
      db.repository.findRewardBySubmissionAndType(submission.id, "base")
    ).toEqual(reward);
    expect(db.repository.listRewardsByTask(draft.id)).toEqual([reward]);
  });
});

import { describe, expect, it } from "vitest";
import { createTestDb } from "../test-db.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepository } from "../sqlite.js";

describe("task persistence repository", () => {
  it("persists task, submission, and reward records in sqlite", async () => {
    const db = await createTestDb();
    const seeded = await db.seedDemo();

    const draft = db.repository.createTaskDraft(seeded.merchant.id, {
      title: "任务持久化测试",
      assetAttachments: [
        {
          id: "asset-1",
          kind: "image",
          url: "/merchant/uploads/asset-1.png",
          fileName: "asset-1.png",
          mimeType: "image/png"
        }
      ]
    });
    expect(draft.status).toBe("draft");

    db.repository.saveTask({
      ...draft,
      status: "published",
      escrowLockedAmount: 3
    });

    const publishedTask = db.repository.getTask(draft.id);
    expect(publishedTask).toMatchObject({
      id: draft.id,
      title: "任务持久化测试",
      status: "published",
      escrowLockedAmount: 3,
      assetAttachments: [
        expect.objectContaining({
          fileName: "asset-1.png"
        })
      ]
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

  it("keeps transaction state sane after begin-immediate lock failures", () => {
    const root = mkdtempSync(join(tmpdir(), "meow-db-"));
    const dbPath = join(root, "locked.sqlite");
    const holder = createRepository(dbPath, { busyTimeoutMs: 0 });
    const contender = createRepository(dbPath, { busyTimeoutMs: 0 });

    try {
      holder.transaction(() => {
        expect(() => contender.transaction(() => {})).toThrowError(
          /database is locked/i
        );
        expect(() => contender.transaction(() => {})).toThrowError(
          /database is locked/i
        );
      });
    } finally {
      holder.close();
      contender.close();
      rmSync(root, { recursive: true, force: true });
    }
  });
});

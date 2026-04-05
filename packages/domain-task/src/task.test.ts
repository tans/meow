import { describe, expect, it } from "vitest";

import * as domainTask from "./index.js";

type DomainTaskApi = typeof import("./index.js");

const api = domainTask as DomainTaskApi;

describe("@meow/domain-task", () => {
  it("exports the requested state enums", () => {
    expect(api.TaskState).toBeDefined();
    expect(api.SubmissionState).toBeDefined();

    expect(api.TaskState?.Draft).toBe("draft");
    expect(api.TaskState?.Funded).toBe("funded");
    expect(api.TaskState?.Published).toBe("published");
    expect(api.TaskState?.Paused).toBe("paused");
    expect(api.TaskState?.Ended).toBe("ended");
    expect(api.TaskState?.Settled).toBe("settled");
    expect(api.TaskState?.Closed).toBe("closed");

    expect(api.SubmissionState?.Submitted).toBe("submitted");
    expect(api.SubmissionState?.Approved).toBe("approved");
    expect(api.SubmissionState?.Rejected).toBe("rejected");
    expect(api.SubmissionState?.Withdrawn).toBe("withdrawn");
  });

  describe("task creation validation", () => {
    it("creates a draft task with normalized initial fields", () => {
      const task = api.createTaskDraft(
        "merchant-1",
        "Spring campaign",
        "Create a short lifestyle video",
        3,
        100,
        50,
        Date.now() + 60_000
      );

      expect(task).not.toBeInstanceOf(Error);
      expect(task).toMatchObject({
        merchantId: "merchant-1",
        title: "Spring campaign",
        description: "Create a short lifestyle video",
        state: "draft",
        maxSubmissions: 3,
        baseReward: 100,
        rankingReward: 50,
        deadline: expect.any(Number)
      });
      expect(task).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number)
        })
      );
      if (!(task instanceof Error) && task !== undefined) {
        expect(task.createdAt).toBe(task.updatedAt);
      }
    });

    it("rejects missing identifiers or empty copy", () => {
      const missingMerchantId = api.createTaskDraft(
        "",
        "Task title",
        "Task description",
        2,
        100,
        0,
        Date.now() + 60_000
      );
      const missingTitle = api.createTaskDraft(
        "merchant-1",
        "",
        "Task description",
        2,
        100,
        0,
        Date.now() + 60_000
      );
      const missingDescription = api.createTaskDraft(
        "merchant-1",
        "Task title",
        "",
        2,
        100,
        0,
        Date.now() + 60_000
      );

      expect(missingMerchantId).toBeInstanceOf(Error);
      expect(missingTitle).toBeInstanceOf(Error);
      expect(missingDescription).toBeInstanceOf(Error);
    });

    it("rejects invalid submission limits, rewards, and deadlines", () => {
      const invalidSubmissionLimit = api.createTaskDraft(
        "merchant-1",
        "Task title",
        "Task description",
        0,
        100,
        0,
        Date.now() + 60_000
      );
      const invalidBaseReward = api.createTaskDraft(
        "merchant-1",
        "Task title",
        "Task description",
        2,
        0,
        10,
        Date.now() + 60_000
      );
      const invalidRankingReward = api.createTaskDraft(
        "merchant-1",
        "Task title",
        "Task description",
        2,
        100,
        -1,
        Date.now() + 60_000
      );
      const invalidDeadline = api.createTaskDraft(
        "merchant-1",
        "Task title",
        "Task description",
        2,
        100,
        10,
        Date.now() - 1
      );

      expect(invalidSubmissionLimit).toBeInstanceOf(Error);
      expect(invalidBaseReward).toBeInstanceOf(Error);
      expect(invalidRankingReward).toBeInstanceOf(Error);
      expect(invalidDeadline).toBeInstanceOf(Error);
    });
  });

  describe("task state transitions", () => {
    it("accepts only valid lifecycle transitions", () => {
      expect(api.canTransitionTo(api.TaskState.Draft, api.TaskState.Funded)).toBe(true);
      expect(api.canTransitionTo(api.TaskState.Funded, api.TaskState.Published)).toBe(true);
      expect(api.canTransitionTo(api.TaskState.Published, api.TaskState.Paused)).toBe(true);
      expect(api.canTransitionTo(api.TaskState.Paused, api.TaskState.Published)).toBe(true);
      expect(api.canTransitionTo(api.TaskState.Published, api.TaskState.Ended)).toBe(true);
      expect(api.canTransitionTo(api.TaskState.Ended, api.TaskState.Settled)).toBe(true);
      expect(api.canTransitionTo(api.TaskState.Settled, api.TaskState.Closed)).toBe(true);

      expect(api.canTransitionTo(api.TaskState.Draft, api.TaskState.Published)).toBe(false);
      expect(api.canTransitionTo(api.TaskState.Funded, api.TaskState.Ended)).toBe(false);
      expect(api.canTransitionTo(api.TaskState.Closed, api.TaskState.Draft)).toBe(false);
    });

    it("moves a task through the full merchant and platform lifecycle", () => {
      const draft = api.createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        5,
        100,
        200,
        Date.now() + 60_000
      );

      expect(draft).not.toBeInstanceOf(Error);
      if (draft instanceof Error || !draft) {
        return;
      }

      const funded = api.fundTask(draft);
      expect(funded).not.toBeInstanceOf(Error);
      expect(funded).toMatchObject({ state: "funded" });

      if (funded instanceof Error || !funded) {
        return;
      }

      const published = api.publishTask(funded);
      expect(published).not.toBeInstanceOf(Error);
      expect(published).toMatchObject({ state: "published" });

      if (published instanceof Error || !published) {
        return;
      }

      const paused = api.pauseTask(published);
      expect(paused).not.toBeInstanceOf(Error);
      expect(paused).toMatchObject({ state: "paused" });

      if (paused instanceof Error || !paused) {
        return;
      }

      const resumed = api.resumeTask(paused);
      expect(resumed).not.toBeInstanceOf(Error);
      expect(resumed).toMatchObject({ state: "published" });

      if (resumed instanceof Error || !resumed) {
        return;
      }

      const ended = api.endTask(resumed);
      expect(ended).not.toBeInstanceOf(Error);
      expect(ended).toMatchObject({ state: "ended" });

      if (ended instanceof Error || !ended) {
        return;
      }

      const settled = api.settleTask(ended);
      expect(settled).not.toBeInstanceOf(Error);
      expect(settled).toMatchObject({ state: "settled" });

      if (settled instanceof Error || !settled) {
        return;
      }

      const closed = api.closeTask(settled);
      expect(closed).not.toBeInstanceOf(Error);
      expect(closed).toMatchObject({ state: "closed" });
    });

    it("rejects invalid task transition commands", () => {
      const draft = api.createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        2,
        100,
        0,
        Date.now() + 60_000
      );

      expect(draft).not.toBeInstanceOf(Error);
      if (draft instanceof Error || !draft) {
        return;
      }

      expect(api.publishTask(draft)).toBeInstanceOf(Error);
      expect(api.pauseTask(draft)).toBeInstanceOf(Error);
      expect(api.closeTask(draft)).toBeInstanceOf(Error);
    });
  });

  describe("submission state machine", () => {
    it("creates submissions in the submitted state", () => {
      const submission = api.createSubmission(
        "task-1",
        "creator-1",
        "https://example.com/video.mp4"
      );

      expect(submission).not.toBeInstanceOf(Error);
      expect(submission).toMatchObject({
        taskId: "task-1",
        creatorId: "creator-1",
        content: "https://example.com/video.mp4",
        state: "submitted",
        reviewNote: null,
        reviewedAt: null
      });
      expect(submission).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          submittedAt: expect.any(Number)
        })
      );
    });

    it("rejects invalid submission payloads", () => {
      expect(api.createSubmission("", "creator-1", "content")).toBeInstanceOf(Error);
      expect(api.createSubmission("task-1", "", "content")).toBeInstanceOf(Error);
      expect(api.createSubmission("task-1", "creator-1", "")).toBeInstanceOf(Error);
    });

    it("supports approve, reject, and withdraw transitions", () => {
      const submission = api.createSubmission(
        "task-1",
        "creator-1",
        "content"
      );

      expect(submission).not.toBeInstanceOf(Error);
      if (submission instanceof Error || !submission) {
        return;
      }

      const approved = api.approveSubmission(submission, "Looks good");
      expect(approved).not.toBeInstanceOf(Error);
      expect(approved).toMatchObject({
        state: "approved",
        reviewNote: "Looks good",
        reviewedAt: expect.any(Number)
      });

      const rejected = api.rejectSubmission(submission, "Needs changes");
      expect(rejected).not.toBeInstanceOf(Error);
      expect(rejected).toMatchObject({
        state: "rejected",
        reviewNote: "Needs changes",
        reviewedAt: expect.any(Number)
      });

      const withdrawn = api.withdrawSubmission(submission);
      expect(withdrawn).not.toBeInstanceOf(Error);
      expect(withdrawn).toMatchObject({
        state: "withdrawn",
        reviewNote: null,
        reviewedAt: null
      });
    });

    it("rejects invalid submission transitions", () => {
      const submission = api.createSubmission(
        "task-1",
        "creator-1",
        "content"
      );

      expect(submission).not.toBeInstanceOf(Error);
      if (submission instanceof Error || !submission) {
        return;
      }

      const approved = api.approveSubmission(submission, "Looks good");
      expect(approved).not.toBeInstanceOf(Error);

      if (approved instanceof Error || !approved) {
        return;
      }

      expect(api.rejectSubmission(approved, "Second review")).toBeInstanceOf(Error);
      expect(api.withdrawSubmission(approved)).toBeInstanceOf(Error);
    });
  });

  describe("submission limits", () => {
    it("enforces max submission counts inclusively at the limit", () => {
      const task = api.createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        3,
        100,
        0,
        Date.now() + 60_000
      );

      expect(task).not.toBeInstanceOf(Error);
      if (task instanceof Error || !task) {
        return;
      }

      expect(api.validateSubmissionCount(task, 0)).toBe(true);
      expect(api.validateSubmissionCount(task, 2)).toBe(true);
      expect(api.validateSubmissionCount(task, 3)).toBe(false);
      expect(api.validateSubmissionCount(task, 4)).toBe(false);
    });
  });
});

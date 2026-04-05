import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  taskEventBus,
  fundTask$,
  publishTask$,
  pauseTask$,
  resumeTask$,
  endTask$,
  endTaskIfExpired$,
  settleTask$,
  closeTask$,
  createSubmission$,
  approveSubmission$,
  rejectSubmission$,
  withdrawSubmission$,
} from "./events.js";
import { createTaskDraft, createSubmission, TaskState, SubmissionState } from "./index.js";

describe("taskEventBus", () => {
  beforeEach(() => {
    taskEventBus.removeAllListeners();
    vi.restoreAllMocks();
  });

  describe("task transition events", () => {
    it("emits task.transitioned when fundTask$ is called", () => {
      const events: unknown[] = [];
      taskEventBus.on("task.transitioned", (e) => events.push(e));

      const task = createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        3,
        100,
        50,
        Date.now() + 60_000
      ) as ReturnType<typeof createTaskDraft>;
      if (task instanceof Error) throw task;

      const funded = fundTask$(task);
      expect(funded).not.toBeInstanceOf(Error);
      expect(funded).toMatchObject({ state: TaskState.Funded });
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        taskId: task.id,
        from: TaskState.Draft,
        to: TaskState.Funded,
      });
    });

    it("emits task.transitioned when publishTask$ is called", () => {
      const events: unknown[] = [];
      taskEventBus.on("task.transitioned", (e) => events.push(e));

      const task = createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        3,
        100,
        50,
        Date.now() + 60_000
      ) as ReturnType<typeof createTaskDraft>;
      if (task instanceof Error) throw task;

      const funded = fundTask$(task) as ReturnType<typeof fundTask$>;
      if (funded instanceof Error) throw funded;

      events.length = 0; // clear fund event
      const published = publishTask$(funded);
      expect(published).not.toBeInstanceOf(Error);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        from: TaskState.Funded,
        to: TaskState.Published,
      });
    });

    it("does not emit task.transitioned when transition returns an Error", () => {
      const events: unknown[] = [];
      taskEventBus.on("task.transitioned", (e) => events.push(e));

      const task = createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        3,
        100,
        50,
        Date.now() + 60_000
      ) as ReturnType<typeof createTaskDraft>;
      if (task instanceof Error) throw task;

      // Try to publish directly from draft — should fail
      const result = publishTask$(task);
      expect(result).toBeInstanceOf(Error);
      expect(events).toHaveLength(0);
    });

    it("endTask$ emits event with the task's actual prior state", () => {
      const events: unknown[] = [];
      taskEventBus.on("task.transitioned", (e) => events.push(e));

      const task = createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        3,
        100,
        50,
        Date.now() + 60_000
      ) as ReturnType<typeof createTaskDraft>;
      if (task instanceof Error) throw task;

      const funded = fundTask$(task) as ReturnType<typeof fundTask$>;
      if (funded instanceof Error) throw funded;

      const published = publishTask$(funded) as ReturnType<typeof publishTask$>;
      if (published instanceof Error) throw published;

      events.length = 0;
      const ended = endTask$(published);
      expect(ended).not.toBeInstanceOf(Error);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        from: TaskState.Published,
        to: TaskState.Ended,
      });
    });

    it("full task lifecycle emits 6 transition events", () => {
      const events: unknown[] = [];
      taskEventBus.on("task.transitioned", (e) => events.push(e));

      let task = createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        3,
        100,
        50,
        Date.now() + 60_000
      ) as ReturnType<typeof createTaskDraft>;
      if (task instanceof Error) throw task;

      task = fundTask$(task) as ReturnType<typeof fundTask$>;
      if (task instanceof Error) throw task;

      task = publishTask$(task) as ReturnType<typeof publishTask$>;
      if (task instanceof Error) throw task;

      task = pauseTask$(task) as ReturnType<typeof pauseTask$>;
      if (task instanceof Error) throw task;

      task = resumeTask$(task) as ReturnType<typeof resumeTask$>;
      if (task instanceof Error) throw task;

      task = endTask$(task) as ReturnType<typeof endTask$>;
      if (task instanceof Error) throw task;

      task = settleTask$(task) as ReturnType<typeof settleTask$>;
      if (task instanceof Error) throw task;

      task = closeTask$(task) as ReturnType<typeof closeTask$>;
      if (task instanceof Error) throw task;

      expect(events).toHaveLength(7);
    });
  });

  describe("submission transition events", () => {
    it("emits submission.transitioned when approveSubmission$ succeeds", () => {
      const events: unknown[] = [];
      taskEventBus.on("submission.transitioned", (e) => events.push(e));

      const submission = createSubmission("task-1", "creator-1", "content");
      if (submission instanceof Error) throw submission;

      const approved = approveSubmission$(submission, "Looks great");
      expect(approved).not.toBeInstanceOf(Error);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        submissionId: submission.id,
        taskId: "task-1",
        from: SubmissionState.Submitted,
        to: SubmissionState.Approved,
      });
    });

    it("emits submission.transitioned when rejectSubmission$ succeeds", () => {
      const events: unknown[] = [];
      taskEventBus.on("submission.transitioned", (e) => events.push(e));

      const submission = createSubmission("task-1", "creator-1", "content");
      if (submission instanceof Error) throw submission;

      const rejected = rejectSubmission$(submission, "Needs changes");
      expect(rejected).not.toBeInstanceOf(Error);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        from: SubmissionState.Submitted,
        to: SubmissionState.Rejected,
      });
    });

    it("emits submission.transitioned when withdrawSubmission$ succeeds", () => {
      const events: unknown[] = [];
      taskEventBus.on("submission.transitioned", (e) => events.push(e));

      const submission = createSubmission("task-1", "creator-1", "content");
      if (submission instanceof Error) throw submission;

      const withdrawn = withdrawSubmission$(submission);
      expect(withdrawn).not.toBeInstanceOf(Error);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        from: SubmissionState.Submitted,
        to: SubmissionState.Withdrawn,
      });
    });

    it("emits submission.created when createSubmission$ succeeds", () => {
      const events: unknown[] = [];
      taskEventBus.on("submission.created", (e) => events.push(e));

      const submission = createSubmission$("task-1", "creator-1", "my content");
      expect(submission).not.toBeInstanceOf(Error);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        submission: expect.objectContaining({
          taskId: "task-1",
          creatorId: "creator-1",
          state: SubmissionState.Submitted,
        }),
      });
    });

    it("does not emit when submission transition returns an Error", () => {
      const events: unknown[] = [];
      taskEventBus.on("submission.transitioned", (e) => events.push(e));

      const submission = createSubmission("task-1", "creator-1", "content");
      if (submission instanceof Error) throw submission;

      const approved = approveSubmission$(submission);
      if (approved instanceof Error) throw approved;

      // Try to approve again — should fail (terminal state)
      const second = approveSubmission$(approved);
      expect(second).toBeInstanceOf(Error);
      expect(events).toHaveLength(1); // only the first approval
    });
  });

  describe("deadline-aware event wrappers", () => {
    it("endTaskIfExpired$ does not emit when task is not expired", () => {
      const events: unknown[] = [];
      taskEventBus.on("task.transitioned", (event) => events.push(event));

      const task = createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        3,
        100,
        50,
        Date.now() + 60_000
      ) as ReturnType<typeof createTaskDraft>;
      if (task instanceof Error) throw task;

      const funded = fundTask$(task) as ReturnType<typeof fundTask$>;
      if (funded instanceof Error) throw funded;

      const published = publishTask$(funded) as ReturnType<typeof publishTask$>;
      if (published instanceof Error) throw published;

      events.length = 0;

      const result = endTaskIfExpired$(published);

      expect(result).toEqual(published);
      expect(events).toHaveLength(0);
    });

    it("endTaskIfExpired$ emits task.transitioned when task deadline has passed", () => {
      const events: unknown[] = [];
      taskEventBus.on("task.transitioned", (event) => events.push(event));

      const deadline = Date.now() + 60_000;
      const task = createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        3,
        100,
        50,
        deadline
      ) as ReturnType<typeof createTaskDraft>;
      if (task instanceof Error) throw task;

      const funded = fundTask$(task) as ReturnType<typeof fundTask$>;
      if (funded instanceof Error) throw funded;

      const published = publishTask$(funded) as ReturnType<typeof publishTask$>;
      if (published instanceof Error) throw published;

      vi.spyOn(Date, "now").mockReturnValue(deadline + 1);
      events.length = 0;

      const result = endTaskIfExpired$(published);

      expect(result).not.toBeInstanceOf(Error);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        taskId: published.id,
        from: TaskState.Published,
        to: TaskState.Ended,
      });
    });

    it("endTaskIfExpired$ does not emit for draft/funded tasks even if expired", () => {
      const events: unknown[] = [];
      taskEventBus.on("task.transitioned", (event) => events.push(event));

      const deadline = Date.now() + 60_000;
      const task = createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        3,
        100,
        50,
        deadline
      ) as ReturnType<typeof createTaskDraft>;
      if (task instanceof Error) throw task;

      vi.spyOn(Date, "now").mockReturnValue(deadline + 1);
      events.length = 0;

      const expiredDraft = endTaskIfExpired$(task);
      expect(expiredDraft).toEqual(task);

      const funded = fundTask$(task) as ReturnType<typeof fundTask$>;
      if (funded instanceof Error) throw funded;

      events.length = 0;
      const expiredFunded = endTaskIfExpired$(funded);
      expect(expiredFunded).toEqual(funded);
      expect(events).toHaveLength(0);
    });
  });

  describe("on() unsubscribe", () => {
    it("returns a function that removes the listener", () => {
      const events: unknown[] = [];
      const unsub = taskEventBus.on("task.transitioned", (e) => events.push(e));

      const task = createTaskDraft(
        "merchant-1",
        "Campaign",
        "Description",
        3,
        100,
        50,
        Date.now() + 60_000
      ) as ReturnType<typeof createTaskDraft>;
      if (task instanceof Error) throw task;

      unsub();

      const funded = fundTask$(task);
      if (funded instanceof Error) throw funded;

      expect(events).toHaveLength(0);
    });
  });
});

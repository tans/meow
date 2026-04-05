/**
 * @meow/domain-task — Domain Event Emitter
 *
 * Provides an in-process event bus for task and submission state transitions.
 * Use the wrapped functions (e.g. `fundTask$`) when you want callers to be
 * able to subscribe to transition events.
 */

import {
  fundTask as _fundTask,
  publishTask as _publishTask,
  pauseTask as _pauseTask,
  resumeTask as _resumeTask,
  endTask as _endTask,
  settleTask as _settleTask,
  closeTask as _closeTask,
  createSubmission as _createSubmission,
  approveSubmission as _approveSubmission,
  rejectSubmission as _rejectSubmission,
  withdrawSubmission as _withdrawSubmission,
  TaskState,
  SubmissionState,
} from "./index.js";
import type { Task, Submission, TaskState as TSS, SubmissionState as SubSS } from "./index.js";

type EventHandler<T = unknown> = (payload: T) => void;

/**
 * Minimal event emitter — no Node.js built-ins required.
 */
export class EventEmitter<Events extends object> {
  private listeners = new Map<keyof Events, Set<EventHandler<unknown>>>();

  /**
   * Register a handler for the given event. Returns an unsubscribe function.
   */
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.listeners.get(event)!.add(handler as EventHandler<unknown>);
    return () => this.listeners.get(event)?.delete(handler as EventHandler<unknown>);
  }

  /** Synchronously dispatch an event to all registered handlers. */
  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners.get(event)?.forEach((h) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h as EventHandler<Events[K]>)((payload as any));
      } catch {
        // handlers must not throw
      }
    });
  }

  /** Remove all handlers for a given event (or all events if no key provided). */
  removeAllListeners(event?: keyof Events): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// ---------------------------------------------------------------------------
// Task event map — all domain events emitted by the task aggregate
// ---------------------------------------------------------------------------

export interface TaskEvents {
  "task.transitioned": { taskId: string; from: TaskState; to: TaskState; task: Task };
  "task.created": { task: Task };
  "submission.created": { submission: Submission };
  "submission.transitioned": {
    submissionId: string;
    taskId: string;
    from: SubmissionState;
    to: SubmissionState;
    submission: Submission;
  };
}

/** Global singleton bus. Import this and call `.on(...)` to subscribe. */
export const taskEventBus = new EventEmitter<TaskEvents>();

// ---------------------------------------------------------------------------
// Timestamp helper
// ---------------------------------------------------------------------------

const now = (): number => Date.now();

// ---------------------------------------------------------------------------
// Wrapped task transition functions
// These call the underlying domain function and emit the corresponding event.
// ---------------------------------------------------------------------------

/**
 * Fund a draft task (draft → funded) and emit a `task.transitioned` event.
 */
export const fundTask$ = (task: Task): Task | Error => {
  const result = _fundTask(task);
  if (!(result instanceof Error)) {
    taskEventBus.emit("task.transitioned", {
      taskId: result.id,
      from: TaskState.Draft,
      to: TaskState.Funded,
      task: result,
    });
  }
  return result;
};

/**
 * Publish a funded task (funded → published) and emit a `task.transitioned` event.
 */
export const publishTask$ = (task: Task): Task | Error => {
  const result = _publishTask(task);
  if (!(result instanceof Error)) {
    taskEventBus.emit("task.transitioned", {
      taskId: result.id,
      from: TaskState.Funded,
      to: TaskState.Published,
      task: result,
    });
  }
  return result;
};

/**
 * Pause a published task (published → paused) and emit a `task.transitioned` event.
 */
export const pauseTask$ = (task: Task): Task | Error => {
  const result = _pauseTask(task);
  if (!(result instanceof Error)) {
    taskEventBus.emit("task.transitioned", {
      taskId: result.id,
      from: TaskState.Published,
      to: TaskState.Paused,
      task: result,
    });
  }
  return result;
};

/**
 * Resume a paused task (paused → published) and emit a `task.transitioned` event.
 */
export const resumeTask$ = (task: Task): Task | Error => {
  const result = _resumeTask(task);
  if (!(result instanceof Error)) {
    taskEventBus.emit("task.transitioned", {
      taskId: result.id,
      from: TaskState.Paused,
      to: TaskState.Published,
      task: result,
    });
  }
  return result;
};

/**
 * End a published or paused task (→ ended) and emit a `task.transitioned` event.
 */
export const endTask$ = (task: Task): Task | Error => {
  // infer the "from" state so the emitted event is accurate
  const from = task.state;
  const result = _endTask(task);
  if (!(result instanceof Error)) {
    taskEventBus.emit("task.transitioned", {
      taskId: result.id,
      from,
      to: TaskState.Ended,
      task: result,
    });
  }
  return result;
};

/**
 * Settle an ended task (ended → settled) and emit a `task.transitioned` event.
 */
export const settleTask$ = (task: Task): Task | Error => {
  const result = _settleTask(task);
  if (!(result instanceof Error)) {
    taskEventBus.emit("task.transitioned", {
      taskId: result.id,
      from: TaskState.Ended,
      to: TaskState.Settled,
      task: result,
    });
  }
  return result;
};

/**
 * Close a settled task (settled → closed) and emit a `task.transitioned` event.
 */
export const closeTask$ = (task: Task): Task | Error => {
  const result = _closeTask(task);
  if (!(result instanceof Error)) {
    taskEventBus.emit("task.transitioned", {
      taskId: result.id,
      from: TaskState.Settled,
      to: TaskState.Closed,
      task: result,
    });
  }
  return result;
};

// ---------------------------------------------------------------------------
// Wrapped submission creation
// ---------------------------------------------------------------------------

/**
 * Create a submission and emit a `submission.created` event.
 */
export const createSubmission$ = (
  taskId: string,
  creatorId: string,
  content: string
): Submission | Error => {
  const result = _createSubmission(taskId, creatorId, content);
  if (!(result instanceof Error)) {
    taskEventBus.emit("submission.created", { submission: result });
  }
  return result;
};

// ---------------------------------------------------------------------------
// Wrapped submission transition functions
// ---------------------------------------------------------------------------

/**
 * Approve a submission and emit a `submission.transitioned` event.
 */
export const approveSubmission$ = (
  submission: Submission,
  reviewNote: string | null = null
): Submission | Error => {
  const from = submission.state;
  const result = _approveSubmission(submission, reviewNote);
  if (!(result instanceof Error)) {
    taskEventBus.emit("submission.transitioned", {
      submissionId: result.id,
      taskId: result.taskId,
      from,
      to: SubmissionState.Approved,
      submission: result,
    });
  }
  return result;
};

/**
 * Reject a submission and emit a `submission.transitioned` event.
 */
export const rejectSubmission$ = (
  submission: Submission,
  reviewNote: string | null = null
): Submission | Error => {
  const from = submission.state;
  const result = _rejectSubmission(submission, reviewNote);
  if (!(result instanceof Error)) {
    taskEventBus.emit("submission.transitioned", {
      submissionId: result.id,
      taskId: result.taskId,
      from,
      to: SubmissionState.Rejected,
      submission: result,
    });
  }
  return result;
};

/**
 * Withdraw a submission and emit a `submission.transitioned` event.
 */
export const withdrawSubmission$ = (submission: Submission): Submission | Error => {
  const from = submission.state;
  const result = _withdrawSubmission(submission);
  if (!(result instanceof Error)) {
    taskEventBus.emit("submission.transitioned", {
      submissionId: result.id,
      taskId: result.taskId,
      from,
      to: SubmissionState.Withdrawn,
      submission: result,
    });
  }
  return result;
};

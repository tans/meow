export enum TaskState {
  Draft = "draft",
  Funded = "funded",
  Published = "published",
  Paused = "paused",
  Ended = "ended",
  Settled = "settled",
  Closed = "closed"
}

export enum SubmissionState {
  Submitted = "submitted",
  Approved = "approved",
  Rejected = "rejected",
  Withdrawn = "withdrawn"
}

export interface Task {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  state: TaskState;
  maxSubmissions: number;
  baseReward: number;
  rankingReward: number;
  deadline: number;
  createdAt: number;
  updatedAt: number;
}

export interface Submission {
  id: string;
  taskId: string;
  creatorId: string;
  content: string;
  state: SubmissionState;
  submittedAt: number;
  reviewedAt: number | null;
  reviewNote: string | null;
}

export type TaskEvent =
  | {
      type: "task.created";
      task: Task;
      occurredAt: number;
    }
  | {
      type: "task.transitioned";
      taskId: string;
      from: TaskState;
      to: TaskState;
      occurredAt: number;
    }
  | {
      type: "submission.created";
      submission: Submission;
      occurredAt: number;
    }
  | {
      type: "submission.transitioned";
      submissionId: string;
      taskId: string;
      from: SubmissionState;
      to: SubmissionState;
      occurredAt: number;
    };

export interface TaskLifecycleStage {
  id: TaskState;
  label: string;
  owner: "merchant" | "platform" | "creator";
  checkpoints: string[];
}

export interface SubmissionGuardrail {
  id: string;
  description: string;
  appliesTo: Array<"merchant" | "creator" | "platform">;
}

const taskTransitions: Record<TaskState, TaskState[]> = {
  [TaskState.Draft]: [TaskState.Funded],
  [TaskState.Funded]: [TaskState.Published],
  [TaskState.Published]: [TaskState.Paused, TaskState.Ended],
  [TaskState.Paused]: [TaskState.Published, TaskState.Ended],
  [TaskState.Ended]: [TaskState.Settled],
  [TaskState.Settled]: [TaskState.Closed],
  [TaskState.Closed]: []
};

const terminalSubmissionStates = new Set<SubmissionState>([
  SubmissionState.Approved,
  SubmissionState.Rejected,
  SubmissionState.Withdrawn
]);

const isNonEmptyText = (value: string): boolean => value.trim().length > 0;

const isPositiveInteger = (value: number): boolean =>
  Number.isInteger(value) && value > 0;

const isNonNegativeInteger = (value: number): boolean =>
  Number.isInteger(value) && value >= 0;

const createDomainError = (message: string): Error => new Error(message);

const nextTimestamp = (): number => Date.now();

const createId = (): string => crypto.randomUUID();

const transitionTaskState = (task: Task, nextState: TaskState): Task | Error => {
  if (!canTransitionTo(task.state, nextState)) {
    return createDomainError(
      `Task ${task.id} cannot transition from ${task.state} to ${nextState}.`
    );
  }

  return {
    ...task,
    state: nextState,
    updatedAt: nextTimestamp()
  };
};

const transitionSubmissionState = (
  submission: Submission,
  nextState: SubmissionState,
  reviewNote: string | null,
  reviewedAt: number | null
): Submission | Error => {
  if (terminalSubmissionStates.has(submission.state)) {
    return createDomainError(
      `Submission ${submission.id} is already terminal in state ${submission.state}.`
    );
  }

  return {
    ...submission,
    state: nextState,
    reviewNote,
    reviewedAt
  };
};

export const taskLifecycle: TaskLifecycleStage[] = [
  {
    id: TaskState.Draft,
    label: "任务草稿",
    owner: "merchant",
    checkpoints: ["任务要求完整", "奖励规则完整", "素材可用"]
  },
  {
    id: TaskState.Funded,
    label: "预算已托管",
    owner: "merchant",
    checkpoints: ["预算覆盖基础奖和排名奖", "余额扣款成功"]
  },
  {
    id: TaskState.Published,
    label: "任务已发布",
    owner: "platform",
    checkpoints: ["任务内容合规", "可见范围生效", "投稿截止时间明确"]
  },
  {
    id: TaskState.Paused,
    label: "任务已暂停",
    owner: "platform",
    checkpoints: ["暂停原因已记录", "创作者可见状态同步"]
  },
  {
    id: TaskState.Ended,
    label: "任务已结束",
    owner: "merchant",
    checkpoints: ["停止接收投稿", "待审核数据冻结"]
  },
  {
    id: TaskState.Settled,
    label: "任务已结算",
    owner: "platform",
    checkpoints: ["基础奖与排名奖发放完成", "未使用赏金退回", "统计归档完成"]
  },
  {
    id: TaskState.Closed,
    label: "任务已关闭",
    owner: "platform",
    checkpoints: ["账务归档完成", "任务不可再编辑"]
  }
];

export const submissionGuardrails: SubmissionGuardrail[] = [
  {
    id: "merchant-configurable-limit",
    description: "单个任务允许商家自定义最大投稿数，默认 3-5 条区间。",
    appliesTo: ["merchant", "creator"]
  },
  {
    id: "duplicate-check",
    description: "任务可启用 AI 查重，用于拦截重复投稿或相似作品。",
    appliesTo: ["merchant", "platform"]
  },
  {
    id: "review-mutation-window",
    description: "审核通过前允许修改或删除投稿，审核通过后删除不影响已获得基础奖。",
    appliesTo: ["creator", "platform"]
  }
];

export const canTransitionTo = (
  currentState: TaskState | string,
  nextState: TaskState | string
): boolean => taskTransitions[currentState as TaskState].includes(nextState as TaskState);

export const createTaskDraft = (
  merchantId: string,
  title: string,
  description: string,
  maxSubmissions: number,
  baseReward: number,
  rankingReward: number,
  deadline: number
): Task | Error => {
  if (!isNonEmptyText(merchantId)) {
    return createDomainError("Merchant ID is required.");
  }

  if (!isNonEmptyText(title)) {
    return createDomainError("Task title is required.");
  }

  if (!isNonEmptyText(description)) {
    return createDomainError("Task description is required.");
  }

  if (!isPositiveInteger(maxSubmissions)) {
    return createDomainError("Max submissions must be a positive integer.");
  }

  if (!isPositiveInteger(baseReward)) {
    return createDomainError("Base reward must be a positive integer.");
  }

  if (!isNonNegativeInteger(rankingReward)) {
    return createDomainError("Ranking reward must be a non-negative integer.");
  }

  if (!Number.isInteger(deadline) || deadline <= nextTimestamp()) {
    return createDomainError("Deadline must be a future unix timestamp.");
  }

  const timestamp = nextTimestamp();

  return {
    id: createId(),
    merchantId: merchantId.trim(),
    title: title.trim(),
    description: description.trim(),
    state: TaskState.Draft,
    maxSubmissions,
    baseReward,
    rankingReward,
    deadline,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export const fundTask = (task: Task): Task | Error =>
  transitionTaskState(task, TaskState.Funded);

export const publishTask = (task: Task): Task | Error =>
  transitionTaskState(task, TaskState.Published);

export const pauseTask = (task: Task): Task | Error =>
  transitionTaskState(task, TaskState.Paused);

export const resumeTask = (task: Task): Task | Error =>
  transitionTaskState(task, TaskState.Published);

export const endTask = (task: Task): Task | Error =>
  transitionTaskState(task, TaskState.Ended);

export const settleTask = (task: Task): Task | Error =>
  transitionTaskState(task, TaskState.Settled);

export const closeTask = (task: Task): Task | Error =>
  transitionTaskState(task, TaskState.Closed);

export const createSubmission = (
  taskId: string,
  creatorId: string,
  content: string
): Submission | Error => {
  if (!isNonEmptyText(taskId)) {
    return createDomainError("Task ID is required.");
  }

  if (!isNonEmptyText(creatorId)) {
    return createDomainError("Creator ID is required.");
  }

  if (!isNonEmptyText(content)) {
    return createDomainError("Submission content is required.");
  }

  return {
    id: createId(),
    taskId: taskId.trim(),
    creatorId: creatorId.trim(),
    content: content.trim(),
    state: SubmissionState.Submitted,
    submittedAt: nextTimestamp(),
    reviewedAt: null,
    reviewNote: null
  };
};

export const approveSubmission = (
  submission: Submission,
  reviewNote: string | null = null
): Submission | Error =>
  transitionSubmissionState(
    submission,
    SubmissionState.Approved,
    reviewNote?.trim() || null,
    nextTimestamp()
  );

export const rejectSubmission = (
  submission: Submission,
  reviewNote: string | null = null
): Submission | Error =>
  transitionSubmissionState(
    submission,
    SubmissionState.Rejected,
    reviewNote?.trim() || null,
    nextTimestamp()
  );

export const withdrawSubmission = (
  submission: Submission
): Submission | Error =>
  transitionSubmissionState(
    submission,
    SubmissionState.Withdrawn,
    null,
    null
  );

export const validateSubmissionCount = (
  task: Task,
  currentCount: number
): boolean => Number.isInteger(currentCount) && currentCount >= 0 && currentCount < task.maxSubmissions;

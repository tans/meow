import type { LedgerAccount, RewardStatus, RewardType } from "@meow/domain-finance";

export interface DemoTaskRecord {
  id: string;
  merchantId: string;
  status: "draft" | "published" | "paused" | "ended" | "settled" | "closed";
  escrowLockedAmount: number;
}

export interface DemoSubmissionRecord {
  id: string;
  taskId: string;
  creatorId: string;
  assetUrl: string;
  description: string;
  status: "submitted" | "approved" | "rejected" | "withdrawn";
  reviewReason?: string;
}

export interface DemoRewardRecord {
  id: string;
  taskId: string;
  submissionId: string;
  creatorId: string;
  type: RewardType;
  amount: number;
  status: RewardStatus;
}

export interface DemoLedgerEntryRecord {
  id: string;
  taskId: string;
  submissionId?: string;
  account: LedgerAccount;
  amount: number;
  direction: "debit" | "credit";
  note: string;
}

const taskStore = new Map<string, DemoTaskRecord>([
  [
    "task-1",
    {
      id: "task-1",
      merchantId: "merchant-1",
      status: "draft",
      escrowLockedAmount: 0
    }
  ]
]);
const submissionStore = new Map<string, DemoSubmissionRecord>();
const rewardStore = new Map<string, DemoRewardRecord>();
const ledgerEntryStore = new Map<string, DemoLedgerEntryRecord>();

let nextTaskId = 2;
let nextRewardId = 1;
let nextLedgerEntryId = 1;

export const db = {
  createTaskDraft(merchantId: string): DemoTaskRecord {
    const taskId = `task-${nextTaskId++}`;
    const task = {
      id: taskId,
      merchantId,
      status: "draft" as const,
      escrowLockedAmount: 0
    };

    taskStore.set(taskId, task);

    return task;
  },
  getTask(taskId: string): DemoTaskRecord | undefined {
    return taskStore.get(taskId);
  },
  listTasks(): DemoTaskRecord[] {
    return [...taskStore.values()];
  },
  saveTask(task: DemoTaskRecord): DemoTaskRecord {
    taskStore.set(task.id, task);
    return task;
  },
  listSubmissionsByTask(taskId: string): DemoSubmissionRecord[] {
    return [...submissionStore.values()].filter((submission) => submission.taskId === taskId);
  },
  getSubmission(submissionId: string): DemoSubmissionRecord | undefined {
    return submissionStore.get(submissionId);
  },
  saveSubmission(submission: DemoSubmissionRecord): DemoSubmissionRecord {
    submissionStore.set(submission.id, submission);
    return submission;
  },
  createReward(
    reward: Omit<DemoRewardRecord, "id">
  ): DemoRewardRecord {
    const record = {
      ...reward,
      id: `reward-${nextRewardId++}`
    };

    rewardStore.set(record.id, record);

    return record;
  },
  saveReward(reward: DemoRewardRecord): DemoRewardRecord {
    rewardStore.set(reward.id, reward);
    return reward;
  },
  findRewardBySubmissionAndType(
    submissionId: string,
    type: RewardType
  ): DemoRewardRecord | undefined {
    return [...rewardStore.values()].find(
      (reward) => reward.submissionId === submissionId && reward.type === type
    );
  },
  listRewardsByTask(taskId: string): DemoRewardRecord[] {
    return [...rewardStore.values()].filter((reward) => reward.taskId === taskId);
  },
  appendLedgerEntries(
    entries: Array<Omit<DemoLedgerEntryRecord, "id">>
  ): DemoLedgerEntryRecord[] {
    return entries.map((entry) => {
      const record = {
        ...entry,
        id: `ledger-${nextLedgerEntryId++}`
      };

      ledgerEntryStore.set(record.id, record);

      return record;
    });
  },
  listLedgerEntriesByTask(taskId: string): DemoLedgerEntryRecord[] {
    return [...ledgerEntryStore.values()].filter((entry) => entry.taskId === taskId);
  }
};

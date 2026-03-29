import type { LedgerAccount } from "@meow/domain-finance";
import type {
  OperatorAction,
  OperatorTargetType,
  RewardStatus,
  RewardType,
  Role,
  SessionClient,
  SubmissionStatus,
  TaskStatus,
  UserState
} from "./schema.js";

export interface UserRecord {
  id: string;
  identifier: string;
  displayName: string;
  roles: Role[];
  state: UserState;
}

export interface SessionRecord {
  id: string;
  userId: string;
  activeRole: Role;
  client: SessionClient;
}

export interface TaskRecord {
  id: string;
  merchantId: string;
  status: TaskStatus;
  escrowLockedAmount: number;
}

export interface SubmissionRecord {
  id: string;
  taskId: string;
  creatorId: string;
  assetUrl: string;
  description: string;
  status: SubmissionStatus;
  reviewReason?: string;
}

export interface RewardRecord {
  id: string;
  taskId: string;
  submissionId: string;
  creatorId: string;
  type: RewardType;
  amount: number;
  status: RewardStatus;
}

export interface LedgerEntryRecord {
  id: string;
  taskId: string;
  submissionId?: string;
  account: LedgerAccount;
  amount: number;
  direction: "debit" | "credit";
  note: string;
  anomalyReason?: string;
}

export interface OperatorActionRecord {
  id: string;
  operatorId: string;
  action: OperatorAction;
  targetType: OperatorTargetType;
  targetId: string;
  reason: string;
}

export interface CreateSessionInput {
  userId: string;
  activeRole: Role;
  client: SessionClient;
}

export interface CreateRewardInput extends Omit<RewardRecord, "id"> {}

export interface CreateOperatorActionInput
  extends Omit<OperatorActionRecord, "id"> {}

export interface DatabaseRepository {
  saveUser(user: UserRecord): UserRecord;
  getUser(userId: string): UserRecord | undefined;
  findUserByIdentifier(identifier: string): UserRecord | undefined;
  updateUserState(userId: string, state: UserState): UserRecord | undefined;
  listUsers(): UserRecord[];

  createSession(input: CreateSessionInput): SessionRecord;
  findSession(sessionId: string): SessionRecord | undefined;
  switchSessionRole(sessionId: string, role: Role): SessionRecord;

  createTaskDraft(merchantId: string): TaskRecord;
  getTask(taskId: string): TaskRecord | undefined;
  listTasks(): TaskRecord[];
  saveTask(task: TaskRecord): TaskRecord;

  getSubmission(submissionId: string): SubmissionRecord | undefined;
  saveSubmission(submission: SubmissionRecord): SubmissionRecord;
  listSubmissionsByTask(taskId: string): SubmissionRecord[];
  listSubmissionsByCreator(creatorId: string): SubmissionRecord[];

  createReward(reward: CreateRewardInput): RewardRecord;
  saveReward(reward: RewardRecord): RewardRecord;
  findRewardBySubmissionAndType(
    submissionId: string,
    type: RewardType
  ): RewardRecord | undefined;
  listRewardsByTask(taskId: string): RewardRecord[];
  listRewardsBySubmission(submissionId: string): RewardRecord[];
  listRewardsByCreator(creatorId: string): RewardRecord[];

  appendLedgerEntries(
    entries: Array<Omit<LedgerEntryRecord, "id">>
  ): LedgerEntryRecord[];
  markLedgerAnomaly(entryId: string, reason: string): LedgerEntryRecord | undefined;
  listLedgerEntriesByTask(taskId: string): LedgerEntryRecord[];

  createOperatorAction(input: CreateOperatorActionInput): OperatorActionRecord;
  listOperatorActions(): OperatorActionRecord[];

  close(): void;
}

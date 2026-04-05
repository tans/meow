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
  title: string;
  status: TaskStatus;
  escrowLockedAmount: number;
  assetAttachments: TaskAssetAttachmentRecord[];
}

export interface TaskAssetAttachmentRecord {
  id: string;
  kind: "image" | "video";
  url: string;
  fileName: string;
  mimeType: string;
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
  transaction<T>(run: () => T): T;

  saveUser(user: UserRecord): UserRecord;
  getUser(userId: string): UserRecord | undefined;
  findUserByIdentifier(identifier: string): UserRecord | undefined;
  updateUserState(userId: string, state: UserState): UserRecord | undefined;
  listUsers(): UserRecord[];

  createSession(input: CreateSessionInput): SessionRecord;
  findSession(sessionId: string): SessionRecord | undefined;
  switchSessionRole(sessionId: string, role: Role): SessionRecord;

  createTaskDraft(
    merchantId: string,
    input?: {
      title?: string;
      assetAttachments?: TaskAssetAttachmentRecord[];
    }
  ): TaskRecord;
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

// File Storage Records
export interface FileObjectRecord {
  id: string;
  bucket: string;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256?: string;
  createdBy: string;
  createdAt: number;
  expiresAt?: number;
}

export interface FileDerivativeRecord {
  id: string;
  sourceFileId: string;
  derivativeType: 'preview_image' | 'preview_video';
  fileObjectId: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingMetadata?: string;
  errorMessage?: string;
  retryCount: number;
  nextRetryAt?: number;
  workerId?: string;
  createdAt: number;
  completedAt?: number;
}

export interface FileAccessLogRecord {
  id: string;
  fileId: string;
  fileType: 'original' | 'preview';
  userId: string;
  userRole: string;
  accessMethod: 'api' | 'presigned_url';
  ipAddress?: string;
  userAgent?: string;
  accessedAt: number;
}

export interface CreateFileObjectInput extends Omit<FileObjectRecord, 'id'> {}
export interface CreateFileDerivativeInput extends Omit<FileDerivativeRecord, 'id'> {}
export interface CreateFileAccessLogInput extends Omit<FileAccessLogRecord, 'id'> {}

export interface FileStorageRepository {
  createFileObject(input: CreateFileObjectInput): FileObjectRecord;
  getFileObject(fileId: string): FileObjectRecord | undefined;
  getFileObjectByKey(objectKey: string): FileObjectRecord | undefined;
  
  createFileDerivative(input: CreateFileDerivativeInput): FileDerivativeRecord;
  getFileDerivative(derivativeId: string): FileDerivativeRecord | undefined;
  getFileDerivativesBySource(sourceFileId: string): FileDerivativeRecord[];
  updateFileDerivativeStatus(
    derivativeId: string, 
    status: FileDerivativeRecord['processingStatus'],
    updates?: Partial<FileDerivativeRecord>
  ): FileDerivativeRecord | undefined;
  getPendingFileDerivatives(limit?: number): FileDerivativeRecord[];
  
  createFileAccessLog(input: CreateFileAccessLogInput): FileAccessLogRecord;
  getFileAccessLogs(fileId: string): FileAccessLogRecord[];
}

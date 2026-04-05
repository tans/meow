import type { LedgerAccount } from "@meow/domain-finance";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const roleValues = ["creator", "merchant", "operator"] as const;
export const sessionClientValues = ["web", "miniapp", "admin"] as const;
export const userStateValues = ["active", "banned"] as const;
export const operatorActionValues = [
  "pause-task",
  "resume-task",
  "ban-user",
  "unban-user",
  "mark-ledger-anomaly",
  "update-settings"
] as const;
export const operatorTargetTypeValues = ["task", "user", "ledger", "settings"] as const;
export const taskStatuses = [
  "draft",
  "published",
  "paused",
  "ended",
  "settled",
  "closed"
] as const;
export const submissionStatuses = [
  "submitted",
  "approved",
  "rejected",
  "withdrawn"
] as const;
export const rewardTypes = ["base", "ranking", "tip"] as const;
export const rewardStatuses = ["frozen", "available", "cancelled"] as const;
export const derivativeTypeValues = ["preview_image", "preview_video"] as const;
export const processingStatusValues = ["pending", "processing", "completed", "failed"] as const;
export const fileTypeValues = ["original", "derivative"] as const;

export type Role = (typeof roleValues)[number];
export type SessionClient = (typeof sessionClientValues)[number];
export type UserState = (typeof userStateValues)[number];
export type OperatorAction = (typeof operatorActionValues)[number];
export type OperatorTargetType = (typeof operatorTargetTypeValues)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type SubmissionStatus = (typeof submissionStatuses)[number];
export type RewardType = (typeof rewardTypes)[number];
export type RewardStatus = (typeof rewardStatuses)[number];
export type DerivativeType = (typeof derivativeTypeValues)[number];
export type ProcessingStatus = (typeof processingStatusValues)[number];
export type FileType = (typeof fileTypeValues)[number];

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  displayName: text("display_name").notNull(),
  roles: text("roles").notNull(),
  state: text("state").$type<UserState>().notNull()
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  activeRole: text("active_role").$type<Role>().notNull(),
  client: text("client").$type<SessionClient>().notNull(),
  createdAt: integer("created_at").notNull()
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").notNull(),
  title: text("title").notNull(),
  status: text("status").$type<TaskStatus>().notNull(),
  escrowLockedAmount: integer("escrow_locked_amount").notNull(),
  assetAttachmentsJson: text("asset_attachments_json").notNull()
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  creatorId: text("creator_id").notNull(),
  assetUrl: text("asset_url").notNull(),
  description: text("description").notNull(),
  status: text("status").$type<SubmissionStatus>().notNull(),
  reviewReason: text("review_reason")
});

export const rewards = sqliteTable("rewards", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id),
  creatorId: text("creator_id").notNull(),
  type: text("type").$type<RewardType>().notNull(),
  amount: integer("amount").notNull(),
  status: text("status").$type<RewardStatus>().notNull()
});

export const ledgerEntries = sqliteTable("ledger_entries", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  submissionId: text("submission_id"),
  account: text("account").$type<LedgerAccount>().notNull(),
  amount: integer("amount").notNull(),
  direction: text("direction").$type<"debit" | "credit">().notNull(),
  note: text("note").notNull(),
  anomalyReason: text("anomaly_reason")
});

export const operatorActions = sqliteTable("operator_actions", {
  id: text("id").primaryKey(),
  operatorId: text("operator_id").notNull(),
  action: text("action").$type<OperatorAction>().notNull(),
  targetType: text("target_type").$type<OperatorTargetType>().notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  createdAt: integer("created_at").notNull()
});

// Rustfs Storage System Tables

export const fileObjects = sqliteTable("file_objects", {
  id: text("id").primaryKey(),
  bucket: text("bucket").notNull(),
  objectKey: text("object_key").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  checksumSha256: text("checksum_sha256"),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at")
});

export const fileDerivatives = sqliteTable("file_derivatives", {
  id: text("id").primaryKey(),
  sourceFileId: text("source_file_id")
    .notNull()
    .references(() => fileObjects.id),
  derivativeType: text("derivative_type").$type<DerivativeType>().notNull(),
  fileObjectId: text("file_object_id")
    .notNull()
    .references(() => fileObjects.id),
  processingStatus: text("processing_status").$type<ProcessingStatus>().notNull().default("pending"),
  processingMetadata: text("processing_metadata"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  nextRetryAt: integer("next_retry_at"),
  workerId: text("worker_id"),
  createdAt: integer("created_at").notNull(),
  completedAt: integer("completed_at")
});

export const fileAccessLogs = sqliteTable("file_access_logs", {
  id: text("id").primaryKey(),
  fileId: text("file_id")
    .notNull()
    .references(() => fileObjects.id),
  fileType: text("file_type").$type<FileType>().notNull(),
  userId: text("user_id").notNull(),
  userRole: text("user_role").notNull(),
  accessMethod: text("access_method").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  accessedAt: integer("accessed_at").notNull()
});

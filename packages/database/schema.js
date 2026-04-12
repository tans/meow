/**
 * @module schema
 * Meow 数据模型枚举与类型定义（JSDoc）
 * 全部为纯 JavaScript，无 TypeScript 依赖
 */

// ── 枚举常量 ──────────────────────────────────────────────────────────────────

/** @type {string[]} */
export const roleValues = ["creator", "merchant", "operator"];

/** @type {string[]} */
export const sessionClientValues = ["web", "miniapp", "admin"];

/** @type {string[]} */
export const userStateValues = ["active", "banned"];

/** @type {string[]} */
export const operatorActionValues = [
  "pause-task", "resume-task", "ban-user", "unban-user",
  "mark-ledger-anomaly", "update-settings"
];

/** @type {string[]} */
export const operatorTargetTypeValues = ["task", "user", "ledger", "settings"];

/** @type {string[]} */
export const taskStatuses = ["draft", "published", "paused", "ended", "settled", "closed"];

/** @type {string[]} */
export const submissionStatuses = ["submitted", "approved", "rejected", "withdrawn"];

/** @type {string[]} */
export const rewardTypes = ["base", "ranking", "tip"];

/** @type {string[]} */
export const rewardStatuses = ["frozen", "available", "cancelled"];

/** @type {string[]} */
export const derivativeTypeValues = ["preview_image", "preview_video"];

/** @type {string[]} */
export const processingStatusValues = ["pending", "processing", "completed", "failed"];

/** @type {string[]} */
export const fileTypeValues = ["original", "derivative"];

// ── 导出类型别名（供 IDE 提示，实际运行时无类型检查）──────────────────────────

/**
 * @typedef {string} Role
 * @typedef {string} SessionClient
 * @typedef {string} UserState
 * @typedef {string} OperatorAction
 * @typedef {string} OperatorTargetType
 * @typedef {string} TaskStatus
 * @typedef {string} SubmissionStatus
 * @typedef {string} RewardType
 * @typedef {string} RewardStatus
 * @typedef {string} DerivativeType
 * @typedef {string} ProcessingStatus
 * @typedef {string} FileType
 */

/**
 * @typedef {Object} UserRecord
 * @property {string} id
 * @property {string} identifier
 * @property {string} displayName
 * @property {Role[]} roles
 * @property {UserState} state
 */

/**
 * @typedef {Object} SessionRecord
 * @property {string} id
 * @property {string} userId
 * @property {Role} activeRole
 * @property {SessionClient} client
 * @property {number} createdAt
 */

/**
 * @typedef {Object} TaskRecord
 * @property {string} id
 * @property {string} merchantId
 * @property {string} title
 * @property {TaskStatus} status
 * @property {number} escrowLockedAmount
 * @property {TaskAssetAttachmentRecord[]} assetAttachments
 */

/**
 * @typedef {Object} TaskAssetAttachmentRecord
 * @property {string} id
 * @property {"image"|"video"} kind
 * @property {string} url
 * @property {string} fileName
 * @property {string} mimeType
 */

/**
 * @typedef {Object} SubmissionRecord
 * @property {string} id
 * @property {string} taskId
 * @property {string} creatorId
 * @property {string} assetUrl
 * @property {string} description
 * @property {SubmissionStatus} status
 * @property {string} [reviewReason]
 */

/**
 * @typedef {Object} RewardRecord
 * @property {string} id
 * @property {string} taskId
 * @property {string} submissionId
 * @property {string} creatorId
 * @property {RewardType} type
 * @property {number} amount
 * @property {RewardStatus} status
 */

/**
 * @typedef {Object} LedgerEntryRecord
 * @property {string} id
 * @property {string} taskId
 * @property {string} [submissionId]
 * @property {string} account
 * @property {number} amount
 * @property {"debit"|"credit"} direction
 * @property {string} note
 * @property {string} [anomalyReason]
 */

/**
 * @typedef {Object} OperatorActionRecord
 * @property {string} id
 * @property {string} operatorId
 * @property {OperatorAction} action
 * @property {OperatorTargetType} targetType
 * @property {string} targetId
 * @property {string} reason
 * @property {number} createdAt
 */

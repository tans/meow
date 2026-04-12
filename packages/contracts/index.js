/**
 * @module contracts
 * API 契约类型定义（JSDoc）
 */

/**
 * @typedef {Object} AuthSessionPayload
 * @property {string} sessionId
 * @property {string} userId
 * @property {string} activeRole
 * @property {string[]} roles
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} identifier
 * @property {string} secret
 * @property {string} client
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} sessionId
 * @property {string} userId
 * @property {string} activeRole
 * @property {string[]} roles
 * @property {object} user
 */

/**
 * @typedef {Object} SwitchRoleRequest
 * @property {string} role
 */

/**
 * @typedef {Object} CreatorTaskFeedItem
 * @property {string} id
 * @property {string} merchantId
 * @property {string} status
 * @property {string} title
 * @property {number} rewardAmount
 */

/**
 * @typedef {Object} CreatorWalletSnapshot
 * @property {string} creatorId
 * @property {number} frozenAmount
 * @property {number} availableAmount
 * @property {number} submissionCount
 */

/**
 * @typedef {Object} MerchantWalletSnapshot
 * @property {string} merchantId
 * @property {number} escrowAmount
 * @property {number} refundableAmount
 * @property {number} tipSpentAmount
 * @property {number} publishedTaskCount
 */

/**
 * @typedef {Object} MerchantTaskAttachment
 * @property {string} id
 * @property {"image"|"video"} kind
 * @property {string} url
 * @property {string} fileName
 * @property {string} mimeType
 */

/**
 * @typedef {Object} MerchantTaskListItem
 * @property {string} id
 * @property {string} merchantId
 * @property {string} title
 * @property {string} status
 * @property {number} escrowLockedAmount
 * @property {number} submissionCount
 * @property {MerchantTaskAttachment[]} assetAttachments
 */

/**
 * @typedef {Object} CreateSubmissionInput
 * @property {string} assetUrl
 * @property {string} description
 */

/**
 * @typedef {Object} SubmissionReadModelItem
 * @property {string} id
 * @property {string} taskId
 * @property {string} creatorId
 * @property {string} status
 * @property {string[]} rewardTags
 */

/**
 * @typedef {Object} CreatorSubmissionItem
 * @extends SubmissionReadModelItem
 * @property {string} assetUrl
 * @property {string} description
 */

/**
 * @typedef {Object} CreateMerchantTaskDraftInput
 * @property {string} title
 * @property {number} [baseAmount]
 * @property {number} [baseCount]
 * @property {number} [rankingTotal]
 * @property {MerchantTaskAttachment[]} [assetAttachments]
 */

/**
 * @typedef {Object} ReviewSubmissionResponse
 * @property {string} submissionId
 * @property {string} status
 * @property {string} [rewardType]
 * @property {string} [rewardStatus]
 */

/**
 * @typedef {Object} SettleTaskResponse
 * @property {string} taskId
 * @property {string} status
 * @property {number} creatorAvailableDelta
 * @property {number} merchantRefundDelta
 */

/** @type {string[]} */
export const surfaceIds = ["web", "wechat-miniapp", "admin", "api"];

/**
 * @module domain-task
 * 任务领域：状态机、边界检查、事件定义
 */

/**
 * 任务生命周期状态
 * @type {string[]}
 */
export const TASK_STATUSES = ["draft", "published", "paused", "ended", "settled", "closed"];

/**
 * 商家只能创建 draft
 * @type {string[]}
 */
export const MERCHANT_WRITABLE_STATUSES = ["draft"];

/**
 * 管理员可操作的状态
 * @type {string[]}
 */
export const ADMIN_WRITABLE_STATUSES = ["published", "paused"];

/**
 * 任务状态转换有效性
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export const canTransition = (from, to) => {
  const map = {
    draft: ["published"],
    published: ["paused", "ended"],
    paused: ["published", "ended"],
    ended: ["settled"],
    settled: ["closed"],
    closed: [],
  };
  return (map[from] || []).includes(to);
};

/**
 * 检查角色是否有权写入任务状态
 * @param {string} role
 * @param {string} status
 * @returns {boolean}
 */
export const canWriteTaskStatus = (role, status) => {
  if (role === "merchant") return MERCHANT_WRITABLE_STATUSES.includes(status);
  if (role === "operator") return ADMIN_WRITABLE_STATUSES.includes(status);
  return false;
};

/**
 * 任务可发布前提条件
 * @param {object} task
 * @returns {{ok: boolean, reason?: string}}
 */
export const canPublish = (task) => {
  if (task.status !== "draft") return { ok: false, reason: "task is not draft" };
  return { ok: true };
};

/**
 * 商家是否持有任务
 * @param {object} task
 * @param {string} merchantId
 * @returns {boolean}
 */
export const merchantOwnsTask = (task, merchantId) => task.merchantId === merchantId;

/**
 * 投稿状态转换
 * @type {string[]}
 */
export const SUBMISSION_STATUSES = ["submitted", "approved", "rejected", "withdrawn"];

/**
 * 创作者可发起的投稿动作
 * @param {string} status
 * @returns {string[]}
 */
export const creatorActions = (status) => {
  if (status === "submitted") return ["edit", "withdraw"];
  if (status === "approved") return [];
  if (status === "rejected") return [];
  if (status === "withdrawn") return [];
  return [];
};

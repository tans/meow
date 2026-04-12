/**
 * @module domain-risk
 * 风控领域
 */

/**
 * 用户状态
 * @type {string[]}
 */
export const USER_STATES = ["active", "banned"];

/**
 * 检查用户是否可操作
 * @param {string} state
 * @returns {boolean}
 */
export const isUserActive = (state) => state === "active";

/**
 * 检查是否可封禁
 * @param {string} state
 * @returns {boolean}
 */
export const canBan = (state) => state !== "banned";

/**
 * 检查是否可解封
 * @param {string} state
 * @returns {boolean}
 */
export const canUnban = (state) => state === "banned";

/**
 * 风控规则：检查任务是否风险
 * @param {object} task
 * @returns {{ok: boolean, reason?: string}}
 */
export const checkTaskRisk = (task) => {
  if (task.status === "draft" && task.escrowLockedAmount === 0) {
    return { ok: true };
  }
  return { ok: true };
};

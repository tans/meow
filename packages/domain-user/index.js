/**
 * @module domain-user
 * 用户领域：角色、信用、权限
 */

/** @type {string[]} */
export const ROLES = ["creator", "merchant", "operator"];

/**
 * 检查用户是否有某角色
 * @param {string[]} roles
 * @param {string} role
 * @returns {boolean}
 */
export const hasRole = (roles, role) => roles.includes(role);

/**
 * 检查是否有任意角色
 * @param {string[]} roles
 * @param {string[]} targets
 * @returns {boolean}
 */
export const hasAnyRole = (roles, targets) => targets.some((r) => roles.includes(r));

/**
 * 检查 session activeRole 是否有效
 * @param {object} session
 * @param {object} user
 * @returns {boolean}
 */
export const isSessionValid = (session, user) => {
  if (!session) return false;
  if (!user) return false;
  return user.roles.includes(session.activeRole);
};

/**
 * 角色别名（路由用）
 * @type {Record<string, string>}
 */
export const roleAlias = {
  creator: "创作者",
  merchant: "商家",
  operator: "运营",
};

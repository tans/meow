/**
 * @module storage
 * 简化的文件存储领域（placeholder）
 */

/** @type {string[]} */
export const BUCKET_TYPES = ["task-assets", "avatar", "general"];

/**
 * 生成存储键
 * @param {string} bucket
 * @param {string} id
 * @param {string} ext
 * @returns {string}
 */
export const makeObjectKey = (bucket, id, ext) =>
  `${bucket}/${id}${ext ? "." + ext : ""}`;

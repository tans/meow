/**
 * @module seed
 * Demo 种子数据
 */
import { ledgerAccounts } from "../domain-finance/index.js";

// Demo 用户
export const demoUsers = {
  merchant: {
    id: "merchant-1",
    identifier: "merchant@example.com",
    displayName: "Demo Merchant",
    roles: ["merchant"],
  },
  creator: {
    id: "creator-1",
    identifier: "creator@example.com",
    displayName: "Demo Creator",
    roles: ["creator"],
  },
  hybrid: {
    id: "hybrid-1",
    identifier: "hybrid@example.com",
    displayName: "Demo Hybrid",
    roles: ["creator", "merchant"],
  },
  operator: {
    id: "operator-1",
    identifier: "operator@example.com",
    displayName: "Demo Operator",
    roles: ["operator"],
  },
};

/**
 * @param {import("bun:sqlite").Database} db
 */
export function seedDemo(db) {
  // 保存用户
  const saveUser = db.prepare(
    "INSERT OR IGNORE INTO users (id, identifier, display_name, roles, state) VALUES (?, ?, ?, ?, ?)"
  );
  for (const u of Object.values(demoUsers)) {
    saveUser.run(u.id, u.identifier, u.displayName, JSON.stringify(u.roles), "active");
  }

  // 创建种子任务
  const existingTask = db.prepare("SELECT id FROM tasks WHERE id = ?").get("task-1");
  if (!existingTask) {
    db.prepare(
      "INSERT INTO tasks (id, merchant_id, title, status, base_amount, base_count, ranking_total, escrow_locked_amount, asset_attachments_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      "task-1",
      demoUsers.merchant.id,
      "春季短视频征稿",
      "draft",
      1,
      1,
      2,
      0,
      "[]"
    );
  }
}

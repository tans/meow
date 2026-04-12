/**
 * @module db
 * Bun / Node 通用 SQLite 连接
 */
import { createRepository } from "./repository.js";
import { seedDemo } from "./seed.js";

// ── 自动检测运行环境 ───────────────────────────────────────────────────────────
const DatabaseCtor =
  typeof Bun !== "undefined"
    ? require("bun:sqlite").Database
    : (() => {
        // node:sqlite 在 Bun 之外不可用，降级为 node-sqlite3 或报错
        if (typeof globalThis.require !== "undefined") {
          try { return globalThis.require("better-sqlite3").Database; } catch {}
        }
        return null;
      })();

if (!DatabaseCtor) {
  throw new Error("No SQLite driver found. Use Bun or install better-sqlite3.");
}

// ── Schema DDL ─────────────────────────────────────────────────────────────────
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  roles TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  active_role TEXT NOT NULL,
  client TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  base_amount INTEGER NOT NULL DEFAULT 1,
  base_count INTEGER NOT NULL DEFAULT 1,
  ranking_total INTEGER NOT NULL DEFAULT 2,
  escrow_locked_amount INTEGER NOT NULL DEFAULT 0,
  asset_attachments_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  review_reason TEXT
);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'frozen'
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  submission_id TEXT,
  account TEXT NOT NULL,
  amount INTEGER NOT NULL,
  direction TEXT NOT NULL,
  note TEXT NOT NULL,
  anomaly_reason TEXT
);

CREATE TABLE IF NOT EXISTS operator_actions (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS file_objects (
  id TEXT PRIMARY KEY,
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum_sha256 TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS file_derivatives (
  id TEXT PRIMARY KEY,
  source_file_id TEXT NOT NULL,
  derivative_type TEXT NOT NULL,
  file_object_id TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  processing_metadata TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at INTEGER,
  worker_id TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

CREATE TABLE IF NOT EXISTS file_access_logs (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  file_type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL,
  access_method TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accessed_at INTEGER NOT NULL
);
`;

// ── 列迁移（向后兼容）──────────────────────────────────────────────────────────
const ensureColumn = (database, tableName, columnName, definition) => {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = columns.some((col) => col.name === columnName);
  if (!hasColumn) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const ensureRuntimeSchema = (database) => {
  ensureColumn(database, "tasks", "base_amount", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn(database, "tasks", "base_count", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn(database, "tasks", "ranking_total", "INTEGER NOT NULL DEFAULT 2");
};

// ── 工厂函数 ───────────────────────────────────────────────────────────────────

/**
 * @param {object} [options]
 * @param {string}  [options.dbPath]      - 数据库文件路径
 * @param {boolean} [options.isTest]     - 是否为测试环境
 * @param {boolean} [options.seed]       - 是否插入种子数据
 */
export function createDatabase(options = {}) {
  const isTest =
    options.isTest ??
    (process.env.VITEST === "true" || process.env.NODE_ENV === "test");

  const dbPath = options.dbPath ?? (isTest ? ":memory:" : process.env.MEOW_DB_PATH ?? "meow.sqlite");

  const shouldSeed = options.seed ?? (process.env.MEOW_DEMO_SEED === "true" || isTest);

  const database = new DatabaseCtor(dbPath);

  if (dbPath !== ":memory:") {
    database.exec("PRAGMA journal_mode = WAL");
    database.exec("PRAGMA foreign_keys = ON");
  }

  database.exec(SCHEMA);
  ensureRuntimeSchema(database);

  if (shouldSeed) {
    seedDemo(database);
  }

  return database;
}

// ── DB 单例（同步创建）────────────────────────────────────────────────────────
let _db = null;

export function getDb() {
  if (!_db) {
    _db = createDatabase();
  }
  return _db;
}

export function createRepositoryContext(options = {}) {
  const sqliteDb = createDatabase(options);
  return {
    sqliteDb,
    db: createRepository(sqliteDb),
  };
}

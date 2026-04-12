/**
 * @module repository
 * 数据仓储层 — bun:sqlite 实现
 */
import { randomUUID } from "crypto";

// ── 辅助函数 ──────────────────────────────────────────────────────────────────

const parseRoles = (rolesJson) => JSON.parse(rolesJson || "[]");
const serializeRoles = (roles) => JSON.stringify(Array.isArray(roles) ? roles : []);
const parseAttachments = (json) => JSON.parse(json || "[]");
const serializeAttachments = (attachments) => JSON.stringify(Array.isArray(attachments) ? attachments : []);

const parseRow = (row) => {
  if (!row) return undefined;
  return {
    id: row.id,
    identifier: row.identifier,
    displayName: row.display_name,
    roles: parseRoles(row.roles),
    state: row.state,
  };
};

const parseSession = (row) => {
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.user_id,
    activeRole: row.active_role,
    client: row.client,
    createdAt: row.created_at,
  };
};

const parseTask = (row) => {
  if (!row) return undefined;
  return {
    id: row.id,
    merchantId: row.merchant_id,
    title: row.title,
    status: row.status,
    baseAmount: row.base_amount,
    baseCount: row.base_count,
    rankingTotal: row.ranking_total,
    escrowLockedAmount: row.escrow_locked_amount,
    assetAttachments: parseAttachments(row.asset_attachments_json),
  };
};

const parseSubmission = (row) => {
  if (!row) return undefined;
  return {
    id: row.id,
    taskId: row.task_id,
    creatorId: row.creator_id,
    assetUrl: row.asset_url,
    description: row.description,
    status: row.status,
    reviewReason: row.review_reason ?? undefined,
  };
};

const parseReward = (row) => {
  if (!row) return undefined;
  return {
    id: row.id,
    taskId: row.task_id,
    submissionId: row.submission_id,
    creatorId: row.creator_id,
    type: row.type,
    amount: row.amount,
    status: row.status,
  };
};

const parseLedger = (row) => {
  if (!row) return undefined;
  return {
    id: row.id,
    taskId: row.task_id,
    submissionId: row.submission_id ?? undefined,
    account: row.account,
    amount: row.amount,
    direction: row.direction,
    note: row.note,
    anomalyReason: row.anomaly_reason ?? undefined,
  };
};

const parseOperatorAction = (row) => {
  if (!row) return undefined;
  return {
    id: row.id,
    operatorId: row.operator_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
};

// ── Prepared Statements ───────────────────────────────────────────────────────
const Stmt = {
  // users
  userById: (db) => db.prepare("SELECT * FROM users WHERE id = ?"),
  userByIdentifier: (db) => db.prepare("SELECT * FROM users WHERE identifier = ?"),
  listUsers: (db) => db.prepare("SELECT * FROM users"),
  upsertUser: (db) => db.prepare(
    "INSERT INTO users (id, identifier, display_name, roles, state) VALUES (?, ?, ?, ?, ?) " +
    "ON CONFLICT(id) DO UPDATE SET identifier=excluded.identifier, display_name=excluded.display_name, roles=excluded.roles, state=excluded.state"
  ),
  updateUserState: (db) => db.prepare("UPDATE users SET state = ? WHERE id = ? RETURNING *"),

  // sessions
  sessionById: (db) => db.prepare("SELECT * FROM sessions WHERE id = ?"),
  upsertSession: (db) => db.prepare(
    "INSERT INTO sessions (id, user_id, active_role, client, created_at) VALUES (?, ?, ?, ?, ?) " +
    "ON CONFLICT(id) DO UPDATE SET active_role=excluded.active_role"
  ),

  // tasks
  taskById: (db) => db.prepare("SELECT * FROM tasks WHERE id = ?"),
  listTasks: (db) => db.prepare("SELECT * FROM tasks"),
  upsertTask: (db) => db.prepare(
    "INSERT INTO tasks (id, merchant_id, title, status, base_amount, base_count, ranking_total, escrow_locked_amount, asset_attachments_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(id) DO UPDATE SET merchant_id=excluded.merchant_id, title=excluded.title, status=excluded.status, base_amount=excluded.base_amount, base_count=excluded.base_count, ranking_total=excluded.ranking_total, escrow_locked_amount=excluded.escrow_locked_amount, asset_attachments_json=excluded.asset_attachments_json"
  ),

  // submissions
  submissionById: (db) => db.prepare("SELECT * FROM submissions WHERE id = ?"),
  listSubmissionsByTask: (db) => db.prepare("SELECT * FROM submissions WHERE task_id = ?"),
  listSubmissionsByCreator: (db) => db.prepare("SELECT * FROM submissions WHERE creator_id = ?"),
  upsertSubmission: (db) => db.prepare(
    "INSERT INTO submissions (id, task_id, creator_id, asset_url, description, status, review_reason) VALUES (?, ?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(id) DO UPDATE SET asset_url=excluded.asset_url, description=excluded.description, status=excluded.status, review_reason=excluded.review_reason"
  ),

  // rewards
  rewardBySubmissionAndType: (db) => db.prepare("SELECT * FROM rewards WHERE submission_id = ? AND type = ?"),
  listRewardsByTask: (db) => db.prepare("SELECT * FROM rewards WHERE task_id = ?"),
  listRewardsBySubmission: (db) => db.prepare("SELECT * FROM rewards WHERE submission_id = ?"),
  listRewardsByCreator: (db) => db.prepare("SELECT * FROM rewards WHERE creator_id = ?"),
  upsertReward: (db) => db.prepare(
    "INSERT INTO rewards (id, task_id, submission_id, creator_id, type, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(id) DO UPDATE SET status=excluded.status"
  ),

  // ledger
  appendLedger: (db) => db.prepare(
    "INSERT INTO ledger_entries (id, task_id, submission_id, account, amount, direction, note, anomaly_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ),
  ledgerByTask: (db) => db.prepare("SELECT * FROM ledger_entries WHERE task_id = ?"),
  listLedger: (db) => db.prepare("SELECT * FROM ledger_entries ORDER BY rowid DESC"),
  updateLedgerAnomaly: (db) => db.prepare("UPDATE ledger_entries SET anomaly_reason = ? WHERE id = ? RETURNING *"),

  // operator actions
  appendOperatorAction: (db) => db.prepare(
    "INSERT INTO operator_actions (id, operator_id, action, target_type, target_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ),
  listOperatorActions: (db) => db.prepare("SELECT * FROM operator_actions ORDER BY created_at DESC"),
};

// ── DatabaseRepository 实现 ─────────────────────────────────────────────────────

/**
 * @param {import("bun:sqlite").Database} db
 * @returns {object}
 */
export function createRepository(db) {
  const run = (fn) => {
    // bun:sqlite 没有事务语法，用 try/catch 包裹
    try { return fn(); } catch (e) { throw e; }
  };

  // ── Users ─────────────────────────────────────────────────────────────────

  const saveUser = (user) => {
    Stmt.upsertUser(db).run(
      user.id, user.identifier, user.displayName,
      serializeRoles(user.roles), user.state
    );
    return user;
  };

  const getUser = (userId) => parseRow(Stmt.userById(db).get(userId));

  const findUserByIdentifier = (identifier) =>
    parseRow(Stmt.userByIdentifier(db).get(identifier));

  const updateUserState = (userId, state) =>
    parseRow(Stmt.updateUserState(db).get(state, userId));

  const listUsers = () =>
    Stmt.listUsers(db).all().map(parseRow);

  // ── Sessions ──────────────────────────────────────────────────────────────

  const createSession = ({ userId, activeRole, client }) => {
    const id = randomUUID();
    const createdAt = Date.now();
    Stmt.upsertSession(db).run(id, userId, activeRole, client, createdAt);
    return { id, userId, activeRole, client, createdAt };
  };

  const findSession = (sessionId) =>
    parseSession(Stmt.sessionById(db).get(sessionId));

  const switchSessionRole = (sessionId, newRole) => {
    const existing = findSession(sessionId);
    if (!existing) return undefined;
    const updated = { ...existing, activeRole: newRole };
    Stmt.upsertSession(db).run(
      updated.id, updated.userId, updated.activeRole, updated.client, updated.createdAt
    );
    return updated;
  };

  // ── Tasks ─────────────────────────────────────────────────────────────────

  const createTaskDraft = (
    merchantId,
    {
      title = "未命名需求",
      baseAmount = 1,
      baseCount = 1,
      rankingTotal = 2,
      assetAttachments = [],
    } = {}
  ) => {
    const id = `task-${randomUUID().slice(0, 8)}`;
    const task = {
      id, merchantId, title,
      status: "draft",
      baseAmount,
      baseCount,
      rankingTotal,
      escrowLockedAmount: 0,
      assetAttachments,
    };
    Stmt.upsertTask(db).run(
      id,
      merchantId,
      title,
      "draft",
      baseAmount,
      baseCount,
      rankingTotal,
      0,
      serializeAttachments(assetAttachments)
    );
    return task;
  };

  const getTask = (taskId) => parseTask(Stmt.taskById(db).get(taskId));

  const listTasks = () => Stmt.listTasks(db).all().map(parseTask);

  const saveTask = (task) => {
    Stmt.upsertTask(db).run(
      task.id,
      task.merchantId,
      task.title,
      task.status,
      task.baseAmount ?? 1,
      task.baseCount ?? 1,
      task.rankingTotal ?? 2,
      task.escrowLockedAmount,
      serializeAttachments(task.assetAttachments)
    );
    return task;
  };

  // ── Submissions ────────────────────────────────────────────────────────────

  const getSubmission = (submissionId) =>
    parseSubmission(Stmt.submissionById(db).get(submissionId));

  const saveSubmission = (submission) => {
    Stmt.upsertSubmission(db).run(
      submission.id, submission.taskId, submission.creatorId,
      submission.assetUrl, submission.description,
      submission.status, submission.reviewReason ?? null
    );
    return submission;
  };

  const listSubmissionsByTask = (taskId) =>
    Stmt.listSubmissionsByTask(db).all(taskId).map(parseSubmission);

  const listSubmissionsByCreator = (creatorId) =>
    Stmt.listSubmissionsByCreator(db).all(creatorId).map(parseSubmission);

  // ── Rewards ────────────────────────────────────────────────────────────────

  const createReward = ({ taskId, submissionId, creatorId, type, amount, status = "frozen" }) => {
    const id = `reward-${randomUUID().slice(0, 8)}`;
    const reward = { id, taskId, submissionId, creatorId, type, amount, status };
    Stmt.upsertReward(db).run(id, taskId, submissionId, creatorId, type, amount, status);
    return reward;
  };

  const saveReward = (reward) => {
    Stmt.upsertReward(db).run(
      reward.id, reward.taskId, reward.submissionId, reward.creatorId,
      reward.type, reward.amount, reward.status
    );
    return reward;
  };

  const findRewardBySubmissionAndType = (submissionId, type) =>
    parseReward(Stmt.rewardBySubmissionAndType(db).get(submissionId, type));

  const listRewardsByTask = (taskId) =>
    Stmt.listRewardsByTask(db).all(taskId).map(parseReward);

  const listRewardsBySubmission = (submissionId) =>
    Stmt.listRewardsBySubmission(db).all(submissionId).map(parseReward);

  const listRewardsByCreator = (creatorId) =>
    Stmt.listRewardsByCreator(db).all(creatorId).map(parseReward);

  // ── Ledger ─────────────────────────────────────────────────────────────────

  const appendLedgerEntries = (entries) => {
    return entries.map((entry) => {
      const id = `ledger-${randomUUID().slice(0, 8)}`;
      Stmt.appendLedger(db).run(
        id, entry.taskId, entry.submissionId ?? null,
        entry.account, entry.amount, entry.direction, entry.note,
        entry.anomalyReason ?? null
      );
      return { id, ...entry };
    });
  };

  const markLedgerAnomaly = (entryId, reason) =>
    parseLedger(Stmt.updateLedgerAnomaly(db).get(reason, entryId));

  const listLedgerEntriesByTask = (taskId) =>
    Stmt.ledgerByTask(db).all(taskId).map(parseLedger);

  const listLedgerEntries = () =>
    db.prepare("SELECT * FROM ledger_entries ORDER BY rowid DESC").all().map(parseLedger);

  // ── Operator Actions ───────────────────────────────────────────────────────

  const createOperatorAction = (input) => {
    const id = `op-${randomUUID().slice(0, 8)}`;
    const createdAt = Date.now();
    Stmt.appendOperatorAction(db).run(
      id, input.operatorId, input.action, input.targetType,
      input.targetId, input.reason, createdAt
    );
    return { id, createdAt, ...input };
  };

  const listOperatorActions = () =>
    Stmt.listOperatorActions(db).all().map(parseOperatorAction);

  // ── Close ──────────────────────────────────────────────────────────────────

  const close = () => db.close();

  // ── 导出接口 ──────────────────────────────────────────────────────────────

  return {
    transaction: run,

    saveUser,
    getUser,
    findUserByIdentifier,
    updateUserState,
    listUsers,

    createSession,
    findSession,
    switchSessionRole,

    createTaskDraft,
    getTask,
    listTasks,
    saveTask,

    getSubmission,
    saveSubmission,
    listSubmissionsByTask,
    listSubmissionsByCreator,

    createReward,
    saveReward,
    findRewardBySubmissionAndType,
    listRewardsByTask,
    listRewardsBySubmission,
    listRewardsByCreator,

    appendLedgerEntries,
    markLedgerAnomaly,
    listLedgerEntriesByTask,
    listLedgerEntries,

    createOperatorAction,
    listOperatorActions,

    close,
  };
}

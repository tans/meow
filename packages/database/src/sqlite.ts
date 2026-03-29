import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type {
  CreateSessionInput,
  DatabaseRepository,
  LedgerEntryRecord,
  OperatorActionRecord,
  RewardRecord,
  SessionRecord,
  SubmissionRecord,
  TaskRecord,
  UserRecord
} from "./repository.js";
import { type Role } from "./schema.js";
import { seedDemo } from "./seed.js";

export interface CreateRepositoryOptions {
  seedDemo?: boolean;
  enableWal?: boolean;
  busyTimeoutMs?: number;
}

const ensureSchema = (db: DatabaseSync) => {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      roles TEXT NOT NULL,
      state TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      active_role TEXT NOT NULL,
      client TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      status TEXT NOT NULL,
      escrow_locked_amount INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      asset_url TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      review_reason TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      submission_id TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (submission_id) REFERENCES submissions(id)
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      submission_id TEXT,
      account TEXT NOT NULL,
      amount INTEGER NOT NULL,
      direction TEXT NOT NULL,
      note TEXT NOT NULL,
      anomaly_reason TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
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

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_creator_id ON submissions(creator_id);
    CREATE INDEX IF NOT EXISTS idx_rewards_task_id ON rewards(task_id);
    CREATE INDEX IF NOT EXISTS idx_rewards_submission_id ON rewards(submission_id);
    CREATE INDEX IF NOT EXISTS idx_rewards_creator_id ON rewards(creator_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_entries_task_id ON ledger_entries(task_id);
  `);
};

const configureRuntimePragmas = (
  db: DatabaseSync,
  filename: string,
  options: CreateRepositoryOptions
) => {
  const busyTimeoutMs = options.busyTimeoutMs ?? 5000;
  db.exec(`PRAGMA busy_timeout = ${busyTimeoutMs}`);

  if (filename !== ":memory:" && options.enableWal !== false) {
    db.exec("PRAGMA journal_mode = WAL");
  }
};

const serializeRoles = (roles: Role[]) => JSON.stringify(roles);

const parseRoles = (roles: string): Role[] => {
  try {
    const parsed = JSON.parse(roles);
    if (Array.isArray(parsed)) {
      return parsed as Role[];
    }
  } catch {
    // ignore invalid serialized data
  }

  return [];
};

interface UserRow {
  id: string;
  identifier: string;
  display_name: string;
  roles: string;
  state: UserRecord["state"];
}

interface SessionRow {
  id: string;
  user_id: string;
  active_role: SessionRecord["activeRole"];
  client: SessionRecord["client"];
}

interface TaskRow {
  id: string;
  merchant_id: string;
  status: TaskRecord["status"];
  escrow_locked_amount: number;
}

interface SubmissionRow {
  id: string;
  task_id: string;
  creator_id: string;
  asset_url: string;
  description: string;
  status: SubmissionRecord["status"];
  review_reason: string | null;
}

interface RewardRow {
  id: string;
  task_id: string;
  submission_id: string;
  creator_id: string;
  type: RewardRecord["type"];
  amount: number;
  status: RewardRecord["status"];
}

interface LedgerEntryRow {
  id: string;
  task_id: string;
  submission_id: string | null;
  account: LedgerEntryRecord["account"];
  amount: number;
  direction: LedgerEntryRecord["direction"];
  note: string;
  anomaly_reason: string | null;
}

interface OperatorActionRow {
  id: string;
  operator_id: string;
  action: OperatorActionRecord["action"];
  target_type: OperatorActionRecord["targetType"];
  target_id: string;
  reason: string;
}

const toUserRecord = (row: UserRow): UserRecord => ({
  id: row.id,
  identifier: row.identifier,
  displayName: row.display_name,
  roles: parseRoles(row.roles),
  state: row.state
});

const toSessionRecord = (row: SessionRow): SessionRecord => ({
  id: row.id,
  userId: row.user_id,
  activeRole: row.active_role,
  client: row.client
});

const toTaskRecord = (row: TaskRow): TaskRecord => ({
  id: row.id,
  merchantId: row.merchant_id,
  status: row.status,
  escrowLockedAmount: row.escrow_locked_amount
});

const toSubmissionRecord = (row: SubmissionRow): SubmissionRecord => ({
  id: row.id,
  taskId: row.task_id,
  creatorId: row.creator_id,
  assetUrl: row.asset_url,
  description: row.description,
  status: row.status,
  reviewReason: row.review_reason ?? undefined
});

const toRewardRecord = (row: RewardRow): RewardRecord => ({
  id: row.id,
  taskId: row.task_id,
  submissionId: row.submission_id,
  creatorId: row.creator_id,
  type: row.type,
  amount: row.amount,
  status: row.status
});

const toLedgerEntryRecord = (row: LedgerEntryRow): LedgerEntryRecord => ({
  id: row.id,
  taskId: row.task_id,
  submissionId: row.submission_id ?? undefined,
  account: row.account,
  amount: row.amount,
  direction: row.direction,
  note: row.note,
  anomalyReason: row.anomaly_reason ?? undefined
});

const toOperatorActionRecord = (
  row: OperatorActionRow
): OperatorActionRecord => ({
  id: row.id,
  operatorId: row.operator_id,
  action: row.action,
  targetType: row.target_type,
  targetId: row.target_id,
  reason: row.reason
});

export const createRepository = (
  filename: string,
  options: CreateRepositoryOptions = {}
): DatabaseRepository => {
  const sqlite = new DatabaseSync(filename);
  ensureSchema(sqlite);
  configureRuntimePragmas(sqlite, filename, options);
  let transactionDepth = 0;

  const repository: DatabaseRepository = {
    transaction(run) {
      const depth = transactionDepth;
      const savepoint = `meow_tx_${depth}`;

      if (depth === 0) {
        sqlite.exec("BEGIN IMMEDIATE");
      } else {
        sqlite.exec(`SAVEPOINT ${savepoint}`);
      }
      transactionDepth += 1;

      try {
        const result = run();

        if (depth === 0) {
          sqlite.exec("COMMIT");
        } else {
          sqlite.exec(`RELEASE SAVEPOINT ${savepoint}`);
        }

        return result;
      } catch (error) {
        if (depth === 0) {
          sqlite.exec("ROLLBACK");
        } else {
          sqlite.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`);
          sqlite.exec(`RELEASE SAVEPOINT ${savepoint}`);
        }

        throw error;
      } finally {
        transactionDepth -= 1;
      }
    },

    saveUser(user) {
      sqlite
        .prepare(
          `
          INSERT INTO users (id, identifier, display_name, roles, state)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            identifier = excluded.identifier,
            display_name = excluded.display_name,
            roles = excluded.roles,
            state = excluded.state
          `
        )
        .run(
          user.id,
          user.identifier,
          user.displayName,
          serializeRoles(user.roles),
          user.state
        );

      return repository.getUser(user.id)!;
    },

    getUser(userId) {
      const row = sqlite
        .prepare(
          "SELECT id, identifier, display_name, roles, state FROM users WHERE id = ?"
        )
        .get(userId) as unknown as UserRow | undefined;

      return row ? toUserRecord(row) : undefined;
    },

    findUserByIdentifier(identifier) {
      const row = sqlite
        .prepare(
          "SELECT id, identifier, display_name, roles, state FROM users WHERE identifier = ?"
        )
        .get(identifier) as unknown as UserRow | undefined;

      return row ? toUserRecord(row) : undefined;
    },

    updateUserState(userId, state) {
      sqlite
        .prepare("UPDATE users SET state = ? WHERE id = ?")
        .run(state, userId);

      return repository.getUser(userId);
    },

    listUsers() {
      const rows = sqlite
        .prepare("SELECT id, identifier, display_name, roles, state FROM users")
        .all() as unknown as UserRow[];

      return rows.map(toUserRecord);
    },

    createSession(input) {
      const record = {
        id: `session-${randomUUID()}`,
        userId: input.userId,
        activeRole: input.activeRole,
        client: input.client
      };

      sqlite
        .prepare(
          `
          INSERT INTO sessions (id, user_id, active_role, client, created_at)
          VALUES (?, ?, ?, ?, ?)
          `
        )
        .run(
          record.id,
          record.userId,
          record.activeRole,
          record.client,
          Date.now()
        );

      return record;
    },

    findSession(sessionId) {
      const row = sqlite
        .prepare(
          "SELECT id, user_id, active_role, client FROM sessions WHERE id = ?"
        )
        .get(sessionId) as unknown as SessionRow | undefined;

      return row ? toSessionRecord(row) : undefined;
    },

    switchSessionRole(sessionId, role) {
      sqlite
        .prepare("UPDATE sessions SET active_role = ? WHERE id = ?")
        .run(role, sessionId);

      const updated = repository.findSession(sessionId);
      if (!updated) {
        throw new Error(`session not found: ${sessionId}`);
      }

      return updated;
    },

    createTaskDraft(merchantId) {
      const record: TaskRecord = {
        id: `task-${randomUUID()}`,
        merchantId,
        status: "draft",
        escrowLockedAmount: 0
      };

      sqlite
        .prepare(
          `
          INSERT INTO tasks (id, merchant_id, status, escrow_locked_amount)
          VALUES (?, ?, ?, ?)
          `
        )
        .run(
          record.id,
          record.merchantId,
          record.status,
          record.escrowLockedAmount
        );

      return record;
    },

    getTask(taskId) {
      const row = sqlite
        .prepare(
          "SELECT id, merchant_id, status, escrow_locked_amount FROM tasks WHERE id = ?"
        )
        .get(taskId) as unknown as TaskRow | undefined;

      return row ? toTaskRecord(row) : undefined;
    },

    listTasks() {
      const rows = sqlite
        .prepare("SELECT id, merchant_id, status, escrow_locked_amount FROM tasks")
        .all() as unknown as TaskRow[];

      return rows.map(toTaskRecord);
    },

    saveTask(task) {
      sqlite
        .prepare(
          `
          INSERT INTO tasks (id, merchant_id, status, escrow_locked_amount)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            merchant_id = excluded.merchant_id,
            status = excluded.status,
            escrow_locked_amount = excluded.escrow_locked_amount
          `
        )
        .run(task.id, task.merchantId, task.status, task.escrowLockedAmount);

      return repository.getTask(task.id)!;
    },

    getSubmission(submissionId) {
      const row = sqlite
        .prepare(
          `
          SELECT id, task_id, creator_id, asset_url, description, status, review_reason
          FROM submissions
          WHERE id = ?
          `
        )
        .get(submissionId) as unknown as SubmissionRow | undefined;

      return row ? toSubmissionRecord(row) : undefined;
    },

    saveSubmission(submission) {
      sqlite
        .prepare(
          `
          INSERT INTO submissions (
            id, task_id, creator_id, asset_url, description, status, review_reason
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            task_id = excluded.task_id,
            creator_id = excluded.creator_id,
            asset_url = excluded.asset_url,
            description = excluded.description,
            status = excluded.status,
            review_reason = excluded.review_reason
          `
        )
        .run(
          submission.id,
          submission.taskId,
          submission.creatorId,
          submission.assetUrl,
          submission.description,
          submission.status,
          submission.reviewReason ?? null
        );

      return repository.getSubmission(submission.id)!;
    },

    listSubmissionsByTask(taskId) {
      const rows = sqlite
        .prepare(
          `
          SELECT id, task_id, creator_id, asset_url, description, status, review_reason
          FROM submissions
          WHERE task_id = ?
          `
        )
        .all(taskId) as unknown as SubmissionRow[];

      return rows.map(toSubmissionRecord);
    },

    listSubmissionsByCreator(creatorId) {
      const rows = sqlite
        .prepare(
          `
          SELECT id, task_id, creator_id, asset_url, description, status, review_reason
          FROM submissions
          WHERE creator_id = ?
          `
        )
        .all(creatorId) as unknown as SubmissionRow[];

      return rows.map(toSubmissionRecord);
    },

    createReward(reward) {
      const record: RewardRecord = {
        ...reward,
        id: `reward-${randomUUID()}`
      };

      sqlite
        .prepare(
          `
          INSERT INTO rewards (id, task_id, submission_id, creator_id, type, amount, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `
        )
        .run(
          record.id,
          record.taskId,
          record.submissionId,
          record.creatorId,
          record.type,
          record.amount,
          record.status
        );

      return record;
    },

    saveReward(reward) {
      sqlite
        .prepare(
          `
          INSERT INTO rewards (id, task_id, submission_id, creator_id, type, amount, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            task_id = excluded.task_id,
            submission_id = excluded.submission_id,
            creator_id = excluded.creator_id,
            type = excluded.type,
            amount = excluded.amount,
            status = excluded.status
          `
        )
        .run(
          reward.id,
          reward.taskId,
          reward.submissionId,
          reward.creatorId,
          reward.type,
          reward.amount,
          reward.status
        );

      const row = sqlite
        .prepare(
          `
          SELECT id, task_id, submission_id, creator_id, type, amount, status
          FROM rewards
          WHERE id = ?
          `
        )
        .get(reward.id) as unknown as RewardRow | undefined;

      if (!row) {
        throw new Error(`reward not found after upsert: ${reward.id}`);
      }

      return toRewardRecord(row);
    },

    findRewardBySubmissionAndType(submissionId, type) {
      const row = sqlite
        .prepare(
          `
          SELECT id, task_id, submission_id, creator_id, type, amount, status
          FROM rewards
          WHERE submission_id = ? AND type = ?
          `
        )
        .get(submissionId, type) as unknown as RewardRow | undefined;

      return row ? toRewardRecord(row) : undefined;
    },

    listRewardsByTask(taskId) {
      const rows = sqlite
        .prepare(
          `
          SELECT id, task_id, submission_id, creator_id, type, amount, status
          FROM rewards
          WHERE task_id = ?
          `
        )
        .all(taskId) as unknown as RewardRow[];

      return rows.map(toRewardRecord);
    },

    listRewardsBySubmission(submissionId) {
      const rows = sqlite
        .prepare(
          `
          SELECT id, task_id, submission_id, creator_id, type, amount, status
          FROM rewards
          WHERE submission_id = ?
          `
        )
        .all(submissionId) as unknown as RewardRow[];

      return rows.map(toRewardRecord);
    },

    listRewardsByCreator(creatorId) {
      const rows = sqlite
        .prepare(
          `
          SELECT id, task_id, submission_id, creator_id, type, amount, status
          FROM rewards
          WHERE creator_id = ?
          `
        )
        .all(creatorId) as unknown as RewardRow[];

      return rows.map(toRewardRecord);
    },

    appendLedgerEntries(entries) {
      return repository.transaction(() => {
        const insert = sqlite.prepare(
          `
          INSERT INTO ledger_entries (
            id, task_id, submission_id, account, amount, direction, note, anomaly_reason
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `
        );
        const records = entries.map((entry) => {
          const record: LedgerEntryRecord = {
            ...entry,
            id: `ledger-${randomUUID()}`
          };

          insert.run(
            record.id,
            record.taskId,
            record.submissionId ?? null,
            record.account,
            record.amount,
            record.direction,
            record.note,
            record.anomalyReason ?? null
          );

          return record;
        });

        return records;
      });
    },

    markLedgerAnomaly(entryId, reason) {
      sqlite
        .prepare("UPDATE ledger_entries SET anomaly_reason = ? WHERE id = ?")
        .run(reason, entryId);

      const row = sqlite
        .prepare(
          `
          SELECT id, task_id, submission_id, account, amount, direction, note, anomaly_reason
          FROM ledger_entries
          WHERE id = ?
          `
        )
        .get(entryId) as unknown as LedgerEntryRow | undefined;

      return row ? toLedgerEntryRecord(row) : undefined;
    },

    listLedgerEntriesByTask(taskId) {
      const rows = sqlite
        .prepare(
          `
          SELECT id, task_id, submission_id, account, amount, direction, note, anomaly_reason
          FROM ledger_entries
          WHERE task_id = ?
          `
        )
        .all(taskId) as unknown as LedgerEntryRow[];

      return rows.map(toLedgerEntryRecord);
    },

    createOperatorAction(input) {
      const record: OperatorActionRecord = {
        ...input,
        id: `operator-action-${randomUUID()}`
      };

      sqlite
        .prepare(
          `
          INSERT INTO operator_actions (
            id, operator_id, action, target_type, target_id, reason, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `
        )
        .run(
          record.id,
          record.operatorId,
          record.action,
          record.targetType,
          record.targetId,
          record.reason,
          Date.now()
        );

      return record;
    },

    listOperatorActions() {
      const rows = sqlite
        .prepare(
          `
          SELECT id, operator_id, action, target_type, target_id, reason
          FROM operator_actions
          ORDER BY created_at ASC
          `
        )
        .all() as unknown as OperatorActionRow[];

      return rows.map(toOperatorActionRecord);
    },

    close() {
      sqlite.close();
    }
  };

  if (options.seedDemo) {
    seedDemo(repository);
  }

  return repository;
};

export type { CreateSessionInput };

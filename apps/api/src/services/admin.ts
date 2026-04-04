import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";

interface GovernanceInput {
  operatorId: string;
  reason: string;
}

interface TaskGovernanceInput extends GovernanceInput {
  taskId: string;
}

interface UserGovernanceInput extends GovernanceInput {
  userId: string;
}

interface LedgerGovernanceInput extends GovernanceInput {
  entryId: string;
}

export interface AdminDashboardSnapshot {
  title: string;
  summary: string;
  metrics: Array<{
    label: string;
    value: string;
    trend: string;
  }>;
  alerts: Array<{
    title: string;
    detail: string;
  }>;
}

export interface AdminLedgerLogRow {
  id: string;
  action: string;
  targetId: string;
  targetType: string;
  operatorId: string;
  reason: string;
}

export interface AdminTaskListItem {
  id: string;
  title: string;
  merchantId: string;
  status: string;
  submissionCount: number;
  escrowLockedAmount: number;
  updatedAt: string;
}

export interface AdminUserListItem {
  id: string;
  identifier: string;
  displayName: string;
  roles: string[];
  state: string;
}

export interface AdminSettingsSnapshot {
  allowTaskPublish: boolean;
  enableTipReward: boolean;
  dailyTaskRewardCap: number;
}

const adminSettingsState: AdminSettingsSnapshot = {
  allowTaskPublish: true,
  enableTipReward: true,
  dailyTaskRewardCap: 100
};

const getTaskOrThrow = (taskId: string) => {
  const task = db.getTask(taskId);

  if (!task) {
    throw new AppError(404, "task not found");
  }

  return task;
};

export const listDashboard = (): AdminDashboardSnapshot => {
  const tasks = db.listTasks();
  const users = db.listUsers();
  const actions = db.listOperatorActions();
  const pausedTasks = tasks.filter((task) => task.status === "paused").length;
  const bannedUsers = users.filter((user) => user.state === "banned").length;
  const recentActions = actions.slice(-3).reverse();

  return {
    title: "系统总览",
    summary: "围绕任务审核、资金流转和风险动作的单日总览。",
    metrics: [
      {
        label: "任务总数",
        value: `${tasks.length}`,
        trend: "基于真实任务仓储"
      },
      {
        label: "暂停任务",
        value: `${pausedTasks}`,
        trend: pausedTasks > 0 ? "存在待恢复任务" : "当前无暂停任务"
      },
      {
        label: "封禁账号",
        value: `${bannedUsers}`,
        trend: "按真实用户状态统计"
      },
      {
        label: "治理动作",
        value: `${actions.length}`,
        trend: "按审计日志累计"
      }
    ],
    alerts:
      recentActions.length > 0
        ? recentActions.map((action) => ({
            title: action.action,
            detail: `${action.targetId} / ${action.reason}`
          }))
        : [
            {
              title: "暂无治理动作",
              detail: "系统尚未记录 operator 审计动作。"
            }
          ]
  };
};

export const pauseTask = (input: TaskGovernanceInput) => {
  const task = getTaskOrThrow(input.taskId);

  if (task.status !== "published") {
    throw new AppError(403, "task cannot be paused");
  }

  const updated = db.saveTask({
    ...task,
    status: "paused"
  });

  db.createOperatorAction({
    operatorId: input.operatorId,
    action: "pause-task",
    targetType: "task",
    targetId: task.id,
    reason: input.reason
  });

  return updated;
};

export const resumeTask = (input: TaskGovernanceInput) => {
  const task = getTaskOrThrow(input.taskId);

  if (task.status !== "paused") {
    throw new AppError(403, "task cannot be resumed");
  }

  const updated = db.saveTask({
    ...task,
    status: "published"
  });

  db.createOperatorAction({
    operatorId: input.operatorId,
    action: "resume-task",
    targetType: "task",
    targetId: task.id,
    reason: input.reason
  });

  return updated;
};

export const banUser = (input: UserGovernanceInput) => {
  const user = db.getUser(input.userId);

  if (!user) {
    throw new AppError(404, "user not found");
  }

  const updated = db.updateUserState(input.userId, "banned");
  if (!updated) {
    throw new AppError(404, "user not found");
  }

  db.createOperatorAction({
    operatorId: input.operatorId,
    action: "ban-user",
    targetType: "user",
    targetId: input.userId,
    reason: input.reason
  });

  return {
    userId: updated.id,
    state: updated.state
  };
};

export const markLedgerAnomaly = (input: LedgerGovernanceInput) => {
  const updated = db.markLedgerAnomaly(input.entryId, input.reason);

  if (!updated) {
    throw new AppError(404, "ledger entry not found");
  }

  db.createOperatorAction({
    operatorId: input.operatorId,
    action: "mark-ledger-anomaly",
    targetType: "ledger",
    targetId: input.entryId,
    reason: input.reason
  });

  return {
    entryId: updated.id,
    status: "flagged",
    anomalyReason: updated.anomalyReason
  };
};

export const listLedgerRows = (): AdminLedgerLogRow[] =>
  db.listOperatorActions().map((action) => ({
    id: action.id,
    action: action.action,
    targetId: action.targetId,
    targetType: action.targetType,
    operatorId: action.operatorId,
    reason: action.reason
  }));

const paginate = <T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; total: number; page: number; pageSize: number } => {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    total: items.length,
    page: safePage,
    pageSize: safePageSize
  };
};

export const listAdminTasks = (input: {
  page: number;
  pageSize: number;
  status?: string;
  keyword?: string;
}) => {
  const submissionCounts = new Map<string, number>();
  for (const task of db.listTasks()) {
    submissionCounts.set(task.id, db.listSubmissionsByTask(task.id).length);
  }

  const keyword = input.keyword?.trim().toLowerCase();
  const filtered = db
    .listTasks()
    .filter((task) => (input.status ? task.status === input.status : true))
    .filter((task) =>
      keyword
        ? task.id.toLowerCase().includes(keyword) ||
          task.title.toLowerCase().includes(keyword)
        : true
    )
    .map<AdminTaskListItem>((task) => ({
      id: task.id,
      title: task.title,
      merchantId: task.merchantId,
      status: task.status,
      submissionCount: submissionCounts.get(task.id) ?? 0,
      escrowLockedAmount: task.escrowLockedAmount,
      updatedAt: new Date().toISOString()
    }));

  const paged = paginate(filtered, input.page, input.pageSize);
  return {
    items: paged.items,
    pagination: {
      page: paged.page,
      pageSize: paged.pageSize,
      total: paged.total
    }
  };
};

export const getAdminTaskDetail = (taskId: string) => {
  const task = getTaskOrThrow(taskId);
  const submissions = db.listSubmissionsByTask(taskId);
  const reviewActions = db
    .listOperatorActions()
    .filter(
      (action) =>
        action.targetType === "task" &&
        action.targetId === taskId &&
        (action.action === "pause-task" || action.action === "resume-task")
    )
    .slice(-10)
    .reverse()
    .map((action) => ({
      action: action.action,
      operatorId: action.operatorId,
      reason: action.reason
    }));

  return {
    id: task.id,
    title: task.title,
    merchantId: task.merchantId,
    status: task.status,
    escrowLockedAmount: task.escrowLockedAmount,
    submissionStats: {
      total: submissions.length,
      approved: submissions.filter((item) => item.status === "approved").length,
      pending: submissions.filter((item) => item.status === "submitted").length
    },
    governanceActions: reviewActions
  };
};

export const listAdminUsers = (input: {
  page: number;
  pageSize: number;
  state?: string;
  role?: string;
  keyword?: string;
}) => {
  const keyword = input.keyword?.trim().toLowerCase();
  const filtered = db
    .listUsers()
    .filter((user) => (input.state ? user.state === input.state : true))
    .filter((user) => (input.role ? user.roles.includes(input.role as never) : true))
    .filter((user) =>
      keyword
        ? user.id.toLowerCase().includes(keyword) ||
          user.identifier.toLowerCase().includes(keyword) ||
          user.displayName.toLowerCase().includes(keyword)
        : true
    )
    .map<AdminUserListItem>((user) => ({
      id: user.id,
      identifier: user.identifier,
      displayName: user.displayName,
      roles: [...user.roles],
      state: user.state
    }));

  const paged = paginate(filtered, input.page, input.pageSize);
  return {
    items: paged.items,
    pagination: {
      page: paged.page,
      pageSize: paged.pageSize,
      total: paged.total
    }
  };
};

export const getAdminSettings = (): AdminSettingsSnapshot => ({ ...adminSettingsState });

export const updateAdminSettings = (
  input: Partial<AdminSettingsSnapshot> & { operatorId: string }
): AdminSettingsSnapshot => {
  const previous = { ...adminSettingsState };

  if (
    input.dailyTaskRewardCap !== undefined &&
    (!Number.isFinite(input.dailyTaskRewardCap) || input.dailyTaskRewardCap < 0)
  ) {
    throw new AppError(400, "invalid admin input");
  }

  if (input.allowTaskPublish !== undefined) {
    adminSettingsState.allowTaskPublish = input.allowTaskPublish;
  }
  if (input.enableTipReward !== undefined) {
    adminSettingsState.enableTipReward = input.enableTipReward;
  }
  if (input.dailyTaskRewardCap !== undefined) {
    adminSettingsState.dailyTaskRewardCap = input.dailyTaskRewardCap;
  }

  const next = { ...adminSettingsState };

  db.createOperatorAction({
    operatorId: input.operatorId,
    action: "update-settings",
    targetType: "settings",
    targetId: "global",
    reason: JSON.stringify({
      before: previous,
      after: next
    })
  });

  return next;
};

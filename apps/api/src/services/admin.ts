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

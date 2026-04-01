import { routeContracts } from "@meow/contracts";
import { workspaceManifest } from "@meow/domain-core";
import { financeConsoleResponsibilities } from "@meow/domain-finance";
import { riskRules } from "@meow/domain-risk";

export interface DashboardMetric {
  label: string;
  value: string;
  trend: string;
}

export interface DashboardAlert {
  title: string;
  detail: string;
}

export interface DashboardSnapshot {
  title: string;
  summary: string;
  metrics: DashboardMetric[];
  alerts: DashboardAlert[];
}

export interface TaskSummary {
  id: string;
  title: string;
  merchant: string;
  status: "published" | "reviewing" | "paused" | "settled";
  submissions: number;
  lockedBudget: string;
}

export interface TaskDetail {
  id: string;
  title: string;
  phase: string;
  rewardSummary: Array<{ label: string; value: string }>;
  submissions: Array<{
    id: string;
    creator: string;
    status: "submitted" | "approved";
    rewardTag: string;
  }>;
}

export interface UserSummary {
  id: string;
  role: "merchant" | "creator" | "operator";
  name: string;
  health: string;
  note: string;
}

export interface LedgerRow {
  id: string;
  account: string;
  action: string;
  amount: string;
  status: string;
}

export interface AdminSession {
  userId: string;
  activeRole: "operator";
  roles: string[];
}

interface AdminLedgerLogResponse {
  id: string;
  action: string;
  targetId: string;
  targetType: string;
  operatorId: string;
  reason: string;
}

const adminResponsibilities =
  workspaceManifest.apps.find((app) => app.id === "admin-shell")?.responsibilities ?? [];

export const dashboardPreview: DashboardSnapshot = {
  title: "系统总览",
  summary: "围绕任务审核、资金流转和风险动作的单日总览。",
  metrics: [
    {
      label: "待审核任务",
      value: "12",
      trend: "较昨日 -2"
    },
    {
      label: "资金结算进度",
      value: "83%",
      trend: "7 个任务待完成退款"
    },
    {
      label: "风险告警",
      value: `${riskRules.length}`,
      trend: "高优先级 2 条"
    }
  ],
  alerts: [
    {
      title: "任务预算托管链路正常",
      detail: financeConsoleResponsibilities[0]
    },
    {
      title: "运营中台覆盖系统/风控/资金职责",
      detail: adminResponsibilities.join(" / ")
    },
    {
      title: "后台路由契约已接入",
      detail: routeContracts
        .filter((route) => route.surface === "admin")
        .map((route) => route.purpose)
        .join(" / ")
    }
  ]
};

export const taskListPreview: TaskSummary[] = [
  {
    id: "task-1",
    title: "春季穿搭口播征稿",
    merchant: "Demo Merchant",
    status: "reviewing",
    submissions: 18,
    lockedBudget: "¥300"
  },
  {
    id: "task-2",
    title: "美食门店探店短视频",
    merchant: "Demo Merchant",
    status: "published",
    submissions: 7,
    lockedBudget: "¥480"
  },
  {
    id: "task-3",
    title: "家居布置图文任务",
    merchant: "North Pier Studio",
    status: "settled",
    submissions: 26,
    lockedBudget: "¥620"
  }
];

export const taskDetailPreview: TaskDetail = {
  id: "task-1",
  title: "春季穿搭口播征稿",
  phase: "审核与结算准备中",
  rewardSummary: [
    { label: "基础奖预算", value: "¥100 / 已锁定" },
    { label: "排名奖预算", value: "¥200 / 待分配" },
    { label: "额外打赏", value: "¥20 / 单笔追加" }
  ],
  submissions: [
    {
      id: "submission-1",
      creator: "Creator A",
      status: "approved",
      rewardTag: "基础奖 + 打赏"
    },
    {
      id: "submission-2",
      creator: "Creator B",
      status: "approved",
      rewardTag: "排名奖候选"
    },
    {
      id: "submission-3",
      creator: "Creator C",
      status: "submitted",
      rewardTag: "待审核"
    }
  ]
};

export const userListPreview: UserSummary[] = [
  {
    id: "merchant-1",
    role: "merchant",
    name: "Demo Merchant",
    health: "活跃",
    note: "近 7 日发布 4 个任务"
  },
  {
    id: "creator-1",
    role: "creator",
    name: "Demo Creator",
    health: "正常",
    note: "冻结收益待结算"
  },
  {
    id: "operator-1",
    role: "operator",
    name: "运营总控台",
    health: "在线",
    note: "负责轻审核与资金巡检"
  }
];

export const ledgerPreview: LedgerRow[] = [
  {
    id: "ledger-1",
    account: "merchant_escrow",
    action: "任务发布托管",
    amount: "+¥300",
    status: "已入账"
  },
  {
    id: "ledger-2",
    account: "creator_frozen",
    action: "审核通过冻结奖励",
    amount: "+¥100",
    status: "待结算"
  },
  {
    id: "ledger-3",
    account: "merchant_balance",
    action: "未使用预算退款",
    amount: "+¥60",
    status: "已回退"
  }
];

export const settingsPreview = {
  responsibilities: adminResponsibilities,
  finance: financeConsoleResponsibilities
};

const parseJson = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }

  return await response.json();
};

const apiFetch = (path: string, init?: RequestInit) => fetch(`/api${path}`, init);

export const loginOperator = async (input = {
  identifier: "operator@example.com",
  secret: "demo-pass",
  client: "admin"
}) =>
  await parseJson(
    await apiFetch("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const fetchAdminSession = async () => {
  const response = await apiFetch("/auth/session");

  if (response.status === 401) {
    return null;
  }

  const session = (await parseJson(response)) as AdminSession;

  return session.activeRole === "operator" ? session : null;
};

export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> =>
  (await parseJson(await apiFetch("/admin/dashboard"))) as DashboardSnapshot;

export const fetchLedgerRows = async (): Promise<LedgerRow[]> => {
  const rows = (await parseJson(
    await apiFetch("/admin/ledger")
  )) as AdminLedgerLogResponse[];

  return rows.map((row) => ({
    id: row.id,
    account: `${row.targetType}:${row.targetId}`,
    action: row.action,
    amount: row.operatorId,
    status: row.reason
  }));
};

export const pauseTask = async (taskId: string, reason: string) =>
  await parseJson(
    await apiFetch(`/admin/tasks/${taskId}/pause`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason })
    })
  );

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
  status: "draft" | "published" | "paused" | "ended" | "settled" | "closed";
  submissions: number;
  lockedBudget: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface TaskQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
}

export interface TaskDetail {
  id: string;
  title: string;
  merchantId: string;
  status: "draft" | "published" | "paused" | "ended" | "settled" | "closed";
  lockedBudget: string;
  submissionStats: {
    total: number;
    approved: number;
    pending: number;
  };
  governanceActions: Array<{
    action: string;
    operatorId: string;
    reason: string;
  }>;
}

export interface UserSummary {
  id: string;
  identifier: string;
  displayName: string;
  roles: string[];
  state: "active" | "banned";
}

export interface UserQuery {
  page?: number;
  pageSize?: number;
  state?: string;
  role?: string;
  keyword?: string;
}

export interface LedgerRow {
  id: string;
  account: string;
  action: string;
  amount: string;
  status: string;
}

export interface AdminSettings {
  allowTaskPublish: boolean;
  enableTipReward: boolean;
  dailyTaskRewardCap: number;
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

interface AdminTaskListResponse {
  items: Array<{
    id: string;
    title: string;
    merchantId: string;
    status: TaskSummary["status"];
    submissionCount: number;
    escrowLockedAmount: number;
    updatedAt: string;
  }>;
  pagination: PaginationMeta;
}

interface AdminTaskDetailResponse {
  id: string;
  title: string;
  merchantId: string;
  status: TaskDetail["status"];
  escrowLockedAmount: number;
  submissionStats: TaskDetail["submissionStats"];
  governanceActions: TaskDetail["governanceActions"];
}

interface AdminUsersResponse {
  items: UserSummary[];
  pagination: PaginationMeta;
}

const adminResponsibilities =
  workspaceManifest.apps.find((app) => app.id === "admin-shell")?.responsibilities ?? [];

const formatMoney = (amount: number) => `¥${amount}`;

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

const parseJson = async <T>(response: Response): Promise<T> => {
  const json = await response
    .json()
    .catch(() => ({ error: `request failed: ${response.status}` }) as Record<string, unknown>);

  if (!response.ok) {
    const message =
      json && typeof json === "object" && typeof json.error === "string"
        ? json.error
        : `request failed: ${response.status}`;
    throw new Error(message);
  }

  return json as T;
};

const apiFetch = (path: string, init?: RequestInit) => fetch(`/api${path}`, init);

const buildQuery = (input: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) {
      continue;
    }

    const text = typeof value === "number" ? `${value}` : value.trim();
    if (text === "") {
      continue;
    }

    params.set(key, text);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

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

  const session = await parseJson<AdminSession>(response);
  return session.activeRole === "operator" ? session : null;
};

export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> =>
  await parseJson(await apiFetch("/admin/dashboard"));

export const fetchLedgerRows = async (): Promise<LedgerRow[]> => {
  const rows = await parseJson<AdminLedgerLogResponse[]>(await apiFetch("/admin/ledger"));

  return rows.map((row) => ({
    id: row.id,
    account: `${row.targetType}:${row.targetId}`,
    action: row.action,
    amount: row.operatorId,
    status: row.reason
  }));
};

export const fetchAdminTasks = async (
  input: TaskQuery = {}
): Promise<PaginatedResult<TaskSummary>> => {
  const response = await parseJson<AdminTaskListResponse>(
    await apiFetch(
      `/admin/tasks${buildQuery({
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 20,
        status: input.status,
        keyword: input.keyword
      })}`
    )
  );

  return {
    items: response.items.map((task) => ({
      id: task.id,
      title: task.title,
      merchant: task.merchantId,
      status: task.status,
      submissions: task.submissionCount,
      lockedBudget: formatMoney(task.escrowLockedAmount)
    })),
    pagination: response.pagination
  };
};

export const fetchAdminTaskDetail = async (taskId: string): Promise<TaskDetail> => {
  const task = await parseJson<AdminTaskDetailResponse>(await apiFetch(`/admin/tasks/${taskId}`));

  return {
    id: task.id,
    title: task.title,
    merchantId: task.merchantId,
    status: task.status,
    lockedBudget: formatMoney(task.escrowLockedAmount),
    submissionStats: task.submissionStats,
    governanceActions: task.governanceActions
  };
};

export const fetchAdminUsers = async (
  input: UserQuery = {}
): Promise<PaginatedResult<UserSummary>> => {
  const response = await parseJson<AdminUsersResponse>(
    await apiFetch(
      `/admin/users${buildQuery({
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 20,
        state: input.state,
        role: input.role,
        keyword: input.keyword
      })}`
    )
  );

  return {
    items: response.items,
    pagination: response.pagination
  };
};

export const fetchAdminSettings = async (): Promise<AdminSettings> =>
  await parseJson(await apiFetch("/admin/settings"));

export const saveAdminSettings = async (input: AdminSettings): Promise<AdminSettings> =>
  await parseJson(
    await apiFetch("/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const pauseTask = async (taskId: string, reason: string) =>
  await parseJson(
    await apiFetch(`/admin/tasks/${taskId}/pause`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason })
    })
  );

export const resumeTask = async (taskId: string, reason: string) =>
  await parseJson(
    await apiFetch(`/admin/tasks/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason })
    })
  );

export const banUser = async (userId: string, reason: string) =>
  await parseJson(
    await apiFetch(`/admin/users/${userId}/ban`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason })
    })
  );

export const markLedgerAnomaly = async (entryId: string, reason: string) =>
  await parseJson(
    await apiFetch(`/admin/ledger/${entryId}/mark-anomaly`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason })
    })
  );

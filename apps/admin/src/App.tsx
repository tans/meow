import { startTransition, useEffect, useState } from "react";
import { AdminLayout } from "./components/AdminLayout.js";
import type { AdminNavId } from "./components/Sidebar.js";
import {
  banUser,
  fetchAdminSettings,
  fetchAdminSession,
  fetchAdminTaskDetail,
  fetchAdminTasks,
  fetchAdminUsers,
  fetchDashboardSnapshot,
  fetchLedgerRows,
  loginOperator,
  markLedgerAnomaly,
  pauseTask,
  resumeTask,
  saveAdminSettings,
  type AdminSettings,
  type AdminSession,
  type DashboardSnapshot,
  type LedgerRow,
  type TaskDetail,
  type TaskSummary,
  type UserSummary
} from "./lib/api.js";
import { DashboardPage } from "./routes/DashboardPage.js";
import { LedgerPage } from "./routes/LedgerPage.js";
import { LoginPage } from "./routes/LoginPage.js";
import { TaskDetailPage } from "./routes/TaskDetailPage.js";
import { TasksPage } from "./routes/TasksPage.js";
import { UsersPage } from "./routes/UsersPage.js";

type AdminView = AdminNavId | "task-detail";

const viewMeta: Record<AdminView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "系统总览",
    subtitle: "集中查看运营告警、结算节奏和风控状态。"
  },
  users: {
    title: "用户管理",
    subtitle: "统一管理商家、创作者和运营账号状态。"
  },
  tasks: {
    title: "任务管理",
    subtitle: "围绕发布、审核、评奖和结算的主链工作台。"
  },
  "task-detail": {
    title: "任务详情",
    subtitle: "查看奖励计划、稿件审核和结算准备状态。"
  },
  ledger: {
    title: "资金管理",
    subtitle: "跟踪预算托管、冻结收益和退款流水。"
  },
  settings: {
    title: "系统设置",
    subtitle: "沉淀系统职责与资金规则，供运营统一配置。"
  }
};

const appStyles = `
:root {
  color-scheme: light;
  --bg: #eef4fb;
  --bg-strong: #dfe9f8;
  --panel: rgba(255, 255, 255, 0.82);
  --panel-strong: #ffffff;
  --line: rgba(43, 72, 117, 0.12);
  --text: #14213d;
  --muted: #5f6f8a;
  --primary: #4f8ef7;
  --primary-dark: #2b7de9;
  --accent: #ff7b43;
  --success: #1f9d6b;
  --radius-xl: 28px;
  --radius-lg: 22px;
  --radius-md: 16px;
  --shadow: 0 18px 40px rgba(47, 79, 124, 0.14);
  font-family: "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(79, 142, 247, 0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(255, 123, 67, 0.16), transparent 22%),
    linear-gradient(180deg, #f7fbff 0%, var(--bg) 100%);
  color: var(--text);
}

button {
  font: inherit;
}

input {
  font: inherit;
}

.admin-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  padding: 28px 22px;
  border-right: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(20px);
}

.sidebar-logo {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 28px;
}

.sidebar-logo-mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--primary), #7d7df6);
  color: white;
  font-size: 22px;
  font-weight: 700;
  box-shadow: var(--shadow);
}

.sidebar-eyebrow,
.card-kicker,
.header-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.sidebar-logo h1,
.header h2,
.section-heading h3,
.hero-card h3,
.panel h3 {
  margin: 0;
}

.sidebar-nav {
  display: grid;
  gap: 10px;
}

.sidebar-item {
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  padding: 14px 16px;
  text-align: left;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.sidebar-item:hover,
.sidebar-item.active {
  transform: translateX(3px);
  background: linear-gradient(135deg, rgba(79, 142, 247, 0.14), rgba(255, 123, 67, 0.1));
  border-color: rgba(79, 142, 247, 0.2);
}

.sidebar-item span,
.sidebar-item small {
  display: block;
}

.sidebar-item small,
.header-subtitle,
.hero-card p,
.list-row p,
.metric-card span,
.panel p {
  color: var(--muted);
}

.admin-main {
  padding: 28px;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 32px;
  margin-bottom: 22px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(230, 239, 251, 0.8));
  box-shadow: var(--shadow);
}

.header-actions {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.header-chip,
.amount-pill,
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.header-chip {
  background: rgba(79, 142, 247, 0.12);
  color: var(--primary-dark);
}

.header-chip.accent {
  background: rgba(255, 123, 67, 0.14);
  color: #c85e1d;
}

.admin-content,
.page-grid,
.metric-grid,
.stack {
  display: grid;
  gap: 18px;
}

.hero-card,
.panel {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--panel);
  box-shadow: var(--shadow);
}

.hero-card {
  background:
    linear-gradient(135deg, rgba(79, 142, 247, 0.14), rgba(255, 123, 67, 0.08)),
    var(--panel-strong);
}

.metric-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-card strong {
  font-size: 32px;
  line-height: 1;
}

.section-heading,
.list-row,
.task-row,
.task-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.list-row,
.task-row {
  padding: 16px 18px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(79, 142, 247, 0.08);
}

.task-table {
  display: grid;
  gap: 12px;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.field-label {
  display: grid;
  gap: 8px;
  color: var(--text);
}

.field-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(79, 142, 247, 0.2);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
}

.inline-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-banner {
  padding: 14px 16px;
  border: 1px solid rgba(200, 60, 60, 0.18);
  border-radius: var(--radius-md);
  background: rgba(255, 239, 239, 0.9);
  color: #9f1d1d;
}

.ghost-button {
  border: 1px solid rgba(79, 142, 247, 0.2);
  background: white;
  color: var(--primary-dark);
  border-radius: 999px;
  padding: 10px 14px;
  cursor: pointer;
}

.status-pill {
  background: rgba(79, 142, 247, 0.12);
  color: var(--primary-dark);
}

.status-pill.published {
  background: rgba(79, 142, 247, 0.12);
}

.status-pill.reviewing,
.status-pill.submitted {
  background: rgba(255, 184, 0, 0.16);
  color: #8a5b00;
}

.status-pill.settled,
.status-pill.approved {
  background: rgba(31, 157, 107, 0.14);
  color: var(--success);
}

.amount-pill {
  background: rgba(20, 33, 61, 0.06);
  color: var(--text);
}

@media (max-width: 1024px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .admin-main {
    padding: 16px;
  }

  .header,
  .section-heading,
  .list-row,
  .task-row,
  .task-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;

function SettingsPanel({
  settings,
  loading,
  saving,
  onChange,
  onSave
}: {
  settings: AdminSettings | null;
  loading: boolean;
  saving: boolean;
  onChange: (patch: Partial<AdminSettings>) => void;
  onSave: () => void | Promise<void>;
}) {
  if (loading || !settings) {
    return (
      <section className="panel stack">
        <div className="section-heading">
          <div>
            <p className="card-kicker">系统设置</p>
            <h3>加载中...</h3>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div className="section-heading">
        <div>
          <p className="card-kicker">系统设置</p>
          <h3>平台开关与奖励阈值</h3>
        </div>
      </div>
      <div className="form-grid">
        <label className="field-label">
          <span className="inline-toggle">
            <input
              aria-label="允许新任务发布"
              type="checkbox"
              checked={settings.allowTaskPublish}
              onChange={(event) => onChange({ allowTaskPublish: event.currentTarget.checked })}
            />
            允许新任务发布
          </span>
        </label>
        <label className="field-label">
          <span className="inline-toggle">
            <input
              aria-label="开启打赏"
              type="checkbox"
              checked={settings.enableTipReward}
              onChange={(event) => onChange({ enableTipReward: event.currentTarget.checked })}
            />
            开启打赏
          </span>
        </label>
        <label className="field-label">
          <span>每日任务奖励上限</span>
          <input
            aria-label="每日任务奖励上限"
            className="field-input"
            type="number"
            min={0}
            value={settings.dailyTaskRewardCap}
            onChange={(event) =>
              onChange({ dailyTaskRewardCap: Number(event.currentTarget.value) })
            }
          />
        </label>
      </div>
      <div className="task-actions">
        <button type="button" className="ghost-button" disabled={saving} onClick={onSave}>
          {saving ? "保存中..." : "保存设置"}
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([]);
  const [taskRows, setTaskRows] = useState<TaskSummary[]>([]);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [userRows, setUserRows] = useState<UserSummary[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyEntryId, setBusyEntryId] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [loadingView, setLoadingView] = useState<AdminView | null>(null);

  const meta = viewMeta[activeView];

  const captureError = (error: unknown) =>
    error instanceof Error ? error.message : "请求失败，请稍后重试";

  const loadOperatorData = async () => {
    const [nextDashboard, nextLedgerRows] = await Promise.all([
      fetchDashboardSnapshot(),
      fetchLedgerRows().catch(() => [])
    ]);

    startTransition(() => {
      setDashboard(nextDashboard);
      setLedgerRows(nextLedgerRows);
    });
  };

  const loadTasks = async () => {
    setLoadingView("tasks");
    try {
      const nextTasks = await fetchAdminTasks();
      startTransition(() => {
        setTaskRows(nextTasks);
      });
    } finally {
      setLoadingView((current) => (current === "tasks" ? null : current));
    }
  };

  const loadTaskDetail = async (taskId: string) => {
    setLoadingView("task-detail");
    try {
      const nextTaskDetail = await fetchAdminTaskDetail(taskId);
      startTransition(() => {
        setTaskDetail(nextTaskDetail);
      });
    } finally {
      setLoadingView((current) => (current === "task-detail" ? null : current));
    }
  };

  const loadUsers = async () => {
    setLoadingView("users");
    try {
      const nextUsers = await fetchAdminUsers();
      startTransition(() => {
        setUserRows(nextUsers);
      });
    } finally {
      setLoadingView((current) => (current === "users" ? null : current));
    }
  };

  const loadSettings = async () => {
    setLoadingView("settings");
    try {
      const nextSettings = await fetchAdminSettings();
      startTransition(() => {
        setSettings(nextSettings);
      });
    } finally {
      setLoadingView((current) => (current === "settings" ? null : current));
    }
  };

  const handleNavigate = (id: AdminNavId) => {
    setErrorMessage(null);
    setActiveView(id);

    if (id === "dashboard" || id === "ledger") {
      void loadOperatorData().catch((error) => {
        setErrorMessage(captureError(error));
      });
      return;
    }

    if (id === "tasks") {
      void loadTasks().catch((error) => {
        setErrorMessage(captureError(error));
      });
      return;
    }

    if (id === "users") {
      void loadUsers().catch((error) => {
        setErrorMessage(captureError(error));
      });
      return;
    }

    void loadSettings().catch((error) => {
      setErrorMessage(captureError(error));
    });
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const nextSession = await fetchAdminSession();

        if (cancelled || !nextSession) {
          return;
        }

        await loadOperatorData();

        if (!cancelled) {
          startTransition(() => {
            setSession(nextSession);
          });
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!session) {
    return (
      <>
        <style>{appStyles}</style>
        <LoginPage
          loading={isBootstrapping || isSubmitting}
          onSubmit={async (input) => {
            setIsSubmitting(true);

            try {
              await loginOperator(input);
              const nextSession = await fetchAdminSession();

              if (!nextSession) {
                throw new Error("operator session missing");
              }

              await loadOperatorData();

              startTransition(() => {
                setSession(nextSession);
              });
            } catch (error) {
              setErrorMessage(captureError(error));
            } finally {
              setIsBootstrapping(false);
              setIsSubmitting(false);
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      <style>{appStyles}</style>
      <AdminLayout
        currentId={activeView === "task-detail" ? "tasks" : activeView}
        onNavigate={handleNavigate}
        title={meta.title}
        subtitle={meta.subtitle}
      >
        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
        {activeView === "dashboard" ? (
          dashboard ? <DashboardPage snapshot={dashboard} /> : <p>加载中...</p>
        ) : null}
        {activeView === "users" ? (
          <UsersPage
            users={userRows}
            busyUserId={busyUserId}
            onBan={async (userId) => {
              setBusyUserId(userId);
              setErrorMessage(null);

              try {
                await banUser(userId, "manual moderation");
                await Promise.all([loadUsers(), loadOperatorData()]);
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setBusyUserId(null);
              }
            }}
          />
        ) : null}
        {activeView === "tasks" ? (
          <TasksPage
            tasks={taskRows}
            busyTaskId={busyTaskId}
            onOpenTask={async (taskId) => {
              setErrorMessage(null);
              setSelectedTaskId(taskId);
              setTaskDetail(null);
              setActiveView("task-detail");
              try {
                await loadTaskDetail(taskId);
              } catch (error) {
                setErrorMessage(captureError(error));
              }
            }}
            onPause={async (taskId) => {
              setBusyTaskId(taskId);
              setErrorMessage(null);

              try {
                await pauseTask(taskId, "manual moderation");
                await Promise.all([
                  loadTasks(),
                  selectedTaskId === taskId ? loadTaskDetail(taskId) : Promise.resolve(),
                  loadOperatorData()
                ]);
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setBusyTaskId(null);
              }
            }}
            onResume={async (taskId) => {
              setBusyTaskId(taskId);
              setErrorMessage(null);

              try {
                await resumeTask(taskId, "issue cleared");
                await Promise.all([
                  loadTasks(),
                  selectedTaskId === taskId ? loadTaskDetail(taskId) : Promise.resolve(),
                  loadOperatorData()
                ]);
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setBusyTaskId(null);
              }
            }}
          />
        ) : null}
        {activeView === "task-detail" ? (
          <TaskDetailPage
            task={taskDetail}
            loading={loadingView === "task-detail"}
            busy={busyTaskId === selectedTaskId}
            onBack={() => setActiveView("tasks")}
            onResume={async (taskId) => {
              setBusyTaskId(taskId);
              setErrorMessage(null);

              try {
                await resumeTask(taskId, "issue cleared");
                await Promise.all([loadTaskDetail(taskId), loadTasks(), loadOperatorData()]);
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setBusyTaskId(null);
              }
            }}
          />
        ) : null}
        {activeView === "ledger" ? (
          <LedgerPage
            entries={ledgerRows}
            busyEntryId={busyEntryId}
            onMarkAnomaly={async (entryId) => {
              setBusyEntryId(entryId);
              setErrorMessage(null);

              try {
                await markLedgerAnomaly(entryId, "amount mismatch");
                await loadOperatorData();
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setBusyEntryId(null);
              }
            }}
          />
        ) : null}
        {activeView === "settings" ? (
          <SettingsPanel
            settings={settings}
            loading={loadingView === "settings"}
            saving={isSavingSettings}
            onChange={(patch) => {
              setSettings((current) => (current ? { ...current, ...patch } : current));
            }}
            onSave={async () => {
              if (!settings) {
                return;
              }

              setIsSavingSettings(true);
              setErrorMessage(null);

              try {
                const nextSettings = await saveAdminSettings(settings);
                startTransition(() => {
                  setSettings(nextSettings);
                });
                await loadOperatorData();
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setIsSavingSettings(false);
              }
            }}
          />
        ) : null}
      </AdminLayout>
    </>
  );
}

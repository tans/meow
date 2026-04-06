import { startTransition, useEffect, useMemo, useState } from "react";
import type { MerchantTaskAttachment } from "@meow/contracts";
import { BuyerLayout } from "./components/BuyerLayout";
import type { BuyerNavId } from "./components/Sidebar";
import {
  addMerchantRankingReward,
  createMerchantTaskDraft,
  getMerchantSession,
  getMerchantTaskDetail,
  getMerchantWalletSnapshot,
  listMerchantTaskSubmissions,
  listMerchantTasks,
  loginMerchant,
  publishMerchantTask,
  reviewMerchantSubmission,
  settleMerchantTask,
  tipMerchantSubmission,
  uploadMerchantTaskAssets,
} from "./lib/api";
import { DashboardPage } from "./routes/DashboardPage";
import { LoginPage } from "./routes/LoginPage";
import { SettingsPage } from "./routes/SettingsPage";
import { TaskDetailPage } from "./routes/TaskDetailPage";
import { TasksPage } from "./routes/TasksPage";
import type { DraftTaskForm } from "./routes/types";
import { WalletPage } from "./routes/WalletPage";

type BuyerView = BuyerNavId | "task-detail";

type BuyerSession = NonNullable<Awaited<ReturnType<typeof getMerchantSession>>>;
type BuyerTask = Awaited<ReturnType<typeof listMerchantTasks>>[number];
type BuyerTaskDetail = Awaited<ReturnType<typeof getMerchantTaskDetail>>;
type BuyerSubmission = Awaited<ReturnType<typeof listMerchantTaskSubmissions>>[number];
type BuyerWallet = Awaited<ReturnType<typeof getMerchantWalletSnapshot>>;

const viewMeta: Record<BuyerView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "发布者工作台",
    subtitle: "集中查看任务状态、投稿进度与资金变化。",
  },
  tasks: {
    title: "需求管理",
    subtitle: "创建需求、发布任务并处理创作者投稿。",
  },
  "task-detail": {
    title: "任务详情",
    subtitle: "执行审核、打赏、排名奖励与结算操作。",
  },
  wallet: {
    title: "资金中心",
    subtitle: "查看托管、可退款与打赏支出等关键指标。",
  },
  settings: {
    title: "账户设置",
    subtitle: "维护默认配置，提升任务发布效率。",
  },
};

const defaultDraftForm: DraftTaskForm = {
  title: "",
  baseAmount: 20,
  baseCount: 10,
  rankingTotal: 100,
};

const appStyles = `
:root {
  color-scheme: light;
  --bg: #fff7f2;
  --panel: rgba(255, 255, 255, 0.86);
  --panel-strong: #ffffff;
  --line: rgba(236, 111, 58, 0.16);
  --text: #2a2a3c;
  --muted: #7d6f6a;
  --primary: #ff6b35;
  --primary-dark: #e85d2d;
  --accent: #327bff;
  --success: #1f9d6b;
  --radius-xl: 26px;
  --radius-lg: 20px;
  --radius-md: 14px;
  --shadow: 0 16px 36px rgba(207, 94, 45, 0.14);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 107, 53, 0.2), transparent 28%),
    radial-gradient(circle at top left, rgba(50, 123, 255, 0.12), transparent 24%),
    linear-gradient(180deg, #fffdfa 0%, var(--bg) 100%);
  color: var(--text);
}

.page-grid,
.stack,
.metric-grid,
.form-grid {
  display: grid;
  gap: 16px;
}

.metric-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.hero-card,
.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--panel);
  box-shadow: var(--shadow);
  padding: 22px;
}

.hero-card {
  background:
    linear-gradient(135deg, rgba(255, 107, 53, 0.14), rgba(50, 123, 255, 0.08)),
    var(--panel-strong);
}

.card-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

h3 {
  margin: 0;
}

.metric-card strong {
  font-size: 28px;
  line-height: 1;
}

.metric-card span,
.muted,
.panel p,
.list-row p {
  color: var(--muted);
}

.section-heading,
.task-row,
.list-row,
.row-actions,
.pagination-row,
.result-meta,
.inline-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.task-table,
.list-table {
  display: grid;
  gap: 10px;
}

.task-row,
.list-row {
  border: 1px solid rgba(236, 111, 58, 0.14);
  border-radius: var(--radius-md);
  padding: 14px;
  background: rgba(255, 255, 255, 0.84);
}

.field-label {
  display: grid;
  gap: 8px;
}

.field-input,
.field-select,
.field-textarea {
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid rgba(236, 111, 58, 0.22);
  background: white;
  color: var(--text);
  padding: 11px 12px;
  font: inherit;
}

.field-textarea {
  min-height: 86px;
  resize: vertical;
}

.ghost-button,
.primary-button,
.warn-button {
  border-radius: 999px;
  padding: 9px 14px;
  cursor: pointer;
  border: 1px solid transparent;
  font: inherit;
}

.ghost-button {
  border-color: rgba(236, 111, 58, 0.24);
  background: white;
  color: var(--primary-dark);
}

.primary-button {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
}

.warn-button {
  background: rgba(255, 71, 87, 0.1);
  color: #b4232f;
  border-color: rgba(255, 71, 87, 0.2);
}

.ghost-button:disabled,
.primary-button:disabled,
.warn-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(50, 123, 255, 0.12);
  color: #205fc2;
}

.status-pill.approved,
.status-pill.settled,
.status-pill.published {
  background: rgba(31, 157, 107, 0.14);
  color: var(--success);
}

.status-pill.rejected,
.status-pill.closed {
  background: rgba(255, 71, 87, 0.12);
  color: #b4232f;
}

.status-pill.draft,
.status-pill.submitted,
.status-pill.paused,
.status-pill.ended,
.status-pill.withdrawn {
  background: rgba(255, 184, 0, 0.16);
  color: #8a5b00;
}

.error-banner {
  border: 1px solid rgba(255, 71, 87, 0.2);
  border-radius: var(--radius-md);
  background: rgba(255, 239, 239, 0.9);
  color: #9f1d1d;
  padding: 12px 14px;
}

.login-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: min(460px, 100%);
}

@media (max-width: 1024px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
`;

export default function App() {
  const [session, setSession] = useState<BuyerSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<BuyerView>("dashboard");
  const [tasks, setTasks] = useState<BuyerTask[]>([]);
  const [wallet, setWallet] = useState<BuyerWallet | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<BuyerTaskDetail | null>(null);
  const [selectedTaskSubmissions, setSelectedTaskSubmissions] = useState<BuyerSubmission[]>([]);
  const [draftForm, setDraftForm] = useState(defaultDraftForm);
  const [draftAssets, setDraftAssets] = useState<MerchantTaskAttachment[]>([]);
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [busySubmissionId, setBusySubmissionId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingView, setLoadingView] = useState<BuyerView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const captureError = (error: unknown) =>
    error instanceof Error ? error.message : "请求失败，请稍后重试";

  const loadCoreData = async () => {
    const [nextTasks, nextWallet] = await Promise.all([
      listMerchantTasks(),
      getMerchantWalletSnapshot(),
    ]);

    startTransition(() => {
      setTasks(nextTasks);
      setWallet(nextWallet);
    });
  };

  const loadTaskDetail = async (taskId: string) => {
    setLoadingDetail(true);
    try {
      const [detail, submissions] = await Promise.all([
        getMerchantTaskDetail(taskId),
        listMerchantTaskSubmissions(taskId),
      ]);
      startTransition(() => {
        setSelectedTaskDetail(detail);
        setSelectedTaskSubmissions(submissions);
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const nextSession = await getMerchantSession();

        if (cancelled || !nextSession || nextSession.activeRole !== "merchant") {
          return;
        }

        await loadCoreData();

        if (!cancelled) {
          startTransition(() => {
            setSession(nextSession);
          });
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(captureError(error));
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

  const meta = viewMeta[activeView];

  const userName = useMemo(() => {
    if (!session) {
      return undefined;
    }
    return `${session.userId} / merchant`;
  }, [session]);

  const gotoTaskDetail = async (taskId: string) => {
    setErrorMessage(null);
    setSelectedTaskId(taskId);
    setSelectedTaskDetail(null);
    setSelectedTaskSubmissions([]);
    setActiveView("task-detail");

    try {
      await loadTaskDetail(taskId);
    } catch (error) {
      setErrorMessage(captureError(error));
    }
  };

  if (!session) {
    return (
      <>
        <style>{appStyles}</style>
        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
        <LoginPage
          loading={isBootstrapping || isSubmitting}
          onSubmit={async ({ identifier, secret }) => {
            setIsSubmitting(true);
            setErrorMessage(null);

            try {
              await loginMerchant({ identifier, secret });
              const nextSession = await getMerchantSession();

              if (!nextSession || nextSession.activeRole !== "merchant") {
                throw new Error("merchant session missing");
              }

              await loadCoreData();

              startTransition(() => {
                setSession(nextSession);
              });
            } catch (error) {
              setErrorMessage(captureError(error));
            } finally {
              setIsSubmitting(false);
              setIsBootstrapping(false);
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      <style>{appStyles}</style>
      <BuyerLayout
        currentId={activeView === "task-detail" ? "tasks" : activeView}
        onNavigate={(id) => {
          setErrorMessage(null);
          setActiveView(id);

          if (id === "dashboard" || id === "wallet" || id === "tasks") {
            setLoadingView(id);
            void loadCoreData()
              .catch((error) => {
                setErrorMessage(captureError(error));
              })
              .finally(() => {
                setLoadingView((current) => (current === id ? null : current));
              });
          }
        }}
        title={meta.title}
        subtitle={meta.subtitle}
        userName={userName}
      >
        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

        {activeView === "dashboard" ? (
          <DashboardPage
            tasks={tasks}
            wallet={wallet}
            onGotoTasks={() => {
              setActiveView("tasks");
            }}
          />
        ) : null}

        {activeView === "tasks" ? (
          <TasksPage
            form={draftForm}
            uploading={isUploadingAssets}
            creating={isCreatingTask || loadingView === "tasks"}
            assets={draftAssets}
            tasks={tasks}
            busyTaskId={busyTaskId}
            onFormChange={(patch) => {
              setDraftForm((current) => ({ ...current, ...patch }));
            }}
            onPickFiles={async (files) => {
              if (!files || files.length === 0) {
                return;
              }

              setIsUploadingAssets(true);
              setErrorMessage(null);

              try {
                const uploaded = await uploadMerchantTaskAssets(Array.from(files));
                setDraftAssets((current) => [...current, ...uploaded]);
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setIsUploadingAssets(false);
              }
            }}
            onRemoveAsset={(assetId) => {
              setDraftAssets((current) => current.filter((asset) => asset.id !== assetId));
            }}
            onCreate={async () => {
              setIsCreatingTask(true);
              setErrorMessage(null);

              try {
                const title = draftForm.title.trim() || "未命名需求";
                await createMerchantTaskDraft({
                  title,
                  baseAmount: Math.max(0, Number(draftForm.baseAmount) || 0),
                  baseCount: Math.max(0, Number(draftForm.baseCount) || 0),
                  rankingTotal: Math.max(0, Number(draftForm.rankingTotal) || 0),
                  assetAttachments: draftAssets,
                });

                setDraftAssets([]);
                await loadCoreData();
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setIsCreatingTask(false);
              }
            }}
            onOpen={(taskId) => {
              void gotoTaskDetail(taskId);
            }}
            onPublish={async (taskId) => {
              setBusyTaskId(taskId);
              setErrorMessage(null);

              try {
                await publishMerchantTask(taskId);
                await loadCoreData();
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setBusyTaskId(null);
              }
            }}
            onSettle={async (taskId) => {
              setBusyTaskId(taskId);
              setErrorMessage(null);

              try {
                await settleMerchantTask(taskId);
                await Promise.all([
                  loadCoreData(),
                  selectedTaskId === taskId ? loadTaskDetail(taskId) : Promise.resolve(),
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
            task={selectedTaskDetail}
            submissions={selectedTaskSubmissions}
            loading={loadingDetail}
            busySubmissionId={busySubmissionId}
            onBack={() => setActiveView("tasks")}
            onApprove={async (submissionId) => {
              if (!selectedTaskId) {
                return;
              }
              setBusySubmissionId(submissionId);
              setErrorMessage(null);

              try {
                await reviewMerchantSubmission(submissionId, "approved");
                await Promise.all([loadTaskDetail(selectedTaskId), loadCoreData()]);
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setBusySubmissionId(null);
              }
            }}
            onReject={async (submissionId) => {
              if (!selectedTaskId) {
                return;
              }
              setBusySubmissionId(submissionId);
              setErrorMessage(null);

              try {
                await reviewMerchantSubmission(submissionId, "rejected");
                await Promise.all([loadTaskDetail(selectedTaskId), loadCoreData()]);
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setBusySubmissionId(null);
              }
            }}
            onTip={async (submissionId) => {
              if (!selectedTaskId) {
                return;
              }
              setBusySubmissionId(submissionId);
              setErrorMessage(null);

              try {
                await tipMerchantSubmission(submissionId);
                await Promise.all([loadTaskDetail(selectedTaskId), loadCoreData()]);
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setBusySubmissionId(null);
              }
            }}
            onRank={async (submissionId) => {
              if (!selectedTaskId) {
                return;
              }
              setBusySubmissionId(submissionId);
              setErrorMessage(null);

              try {
                await addMerchantRankingReward(selectedTaskId, submissionId);
                await Promise.all([loadTaskDetail(selectedTaskId), loadCoreData()]);
              } catch (error) {
                setErrorMessage(captureError(error));
              } finally {
                setBusySubmissionId(null);
              }
            }}
          />
        ) : null}

        {activeView === "wallet" ? <WalletPage wallet={wallet} /> : null}

        {activeView === "settings" ? (
          <SettingsPage
            defaults={draftForm}
            onChange={(patch) => {
              setDraftForm((current) => ({ ...current, ...patch }));
            }}
          />
        ) : null}
      </BuyerLayout>
    </>
  );
}

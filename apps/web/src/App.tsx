import { startTransition, useEffect, useRef, useState } from "react";
import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useInRouterContext,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import { BottomTabBar } from "./components/BottomTabBar.js";
import { MobileShell } from "./components/MobileShell.js";
import { RoleSwitch } from "./components/RoleSwitch.js";
import { TopBar } from "./components/TopBar.js";
import {
  addMerchantRankingReward,
  createMerchantTaskDraft,
  createCreatorSubmission,
  getCreatorTaskDetail as fetchCreatorTaskDetail,
  getCreatorWallet,
  getMerchantTaskDetail,
  getSession,
  listCreatorSubmissions,
  listCreatorTaskSubmissions,
  listCreatorTasks,
  listMerchantTaskSubmissions,
  listMerchantTasks,
  login,
  publishMerchantTask,
  reviewMerchantSubmission,
  settleMerchantTask,
  switchRole,
  tipMerchantSubmission,
  updateCreatorSubmission,
  withdrawCreatorSubmission
} from "./lib/api.js";
import {
  buildMerchantSettlementSummary,
  buildMerchantTaskMetaFromForm,
  creatorLobbyChannels,
  mapMerchantReviewCard,
  mapMerchantTaskDetail,
  mapCreatorSubmissionCard,
  mapCreatorTaskDetail,
  mapCreatorTasks,
  mapCreatorWalletMetrics,
  mapMerchantTasks,
  type CreatorTaskCardModel,
  type CreatorSubmissionCardModel,
  type CreatorTaskDetailModel,
  type MerchantReviewCardModel,
  type MerchantSettlementModel,
  type MerchantTaskCreateFormModel,
  type MerchantTaskDetailModel,
  type MerchantTaskLocalMetaModel,
  type MerchantTaskCardModel,
  type WalletMetricModel
} from "./lib/models.js";
import {
  defaultPathForRole,
  isCreatorTabPath,
  normalizeWebSession,
  type WebRole,
  type WebSession
} from "./lib/session.js";
import { AwardsPage } from "./routes/AwardsPage.js";
import { CreatorEarningsPage } from "./routes/CreatorEarningsPage.js";
import { CreatorHomePage } from "./routes/CreatorHomePage.js";
import { CreatorTaskDetailPage } from "./routes/CreatorTaskDetailPage.js";
import { CreatorTaskFeedPage } from "./routes/CreatorTaskFeedPage.js";
import { LoginPage } from "./routes/LoginPage.js";
import { MerchantReviewPage } from "./routes/MerchantReviewPage.js";
import { MerchantSettlementPage } from "./routes/MerchantSettlementPage.js";
import { MerchantTaskCreatePage } from "./routes/MerchantTaskCreatePage.js";
import { MerchantTaskDetailPage } from "./routes/MerchantTaskDetailPage.js";
import { MerchantTasksPage } from "./routes/MerchantTasksPage.js";
import { ProfilePage } from "./routes/ProfilePage.js";
import { SubmissionEditorPage } from "./routes/SubmissionEditorPage.js";
import { WalletPage } from "./routes/WalletPage.js";

interface AppProps {
  session?: WebSession | null;
  initialSession?: WebSession | null;
  initialTasks?: CreatorTaskCardModel[] | MerchantTaskCardModel[];
  bootstrapSession?: boolean;
}

export type { WebSession };

const loadSurfaceTasks = async (
  session: WebSession,
  merchantTaskMetaById: Record<string, MerchantTaskLocalMetaModel> = {}
): Promise<{
  creatorTasks: CreatorTaskCardModel[];
  merchantTasks: MerchantTaskCardModel[];
}> => {
  if (session.activeRole === "creator") {
    return {
      creatorTasks: mapCreatorTasks(await listCreatorTasks()),
      merchantTasks: []
    };
  }

  return {
    creatorTasks: [],
    merchantTasks: mapMerchantTasks(await listMerchantTasks(), merchantTaskMetaById)
  };
};

const getInitialTaskState = (
  session: WebSession | null,
  initialTasks?: CreatorTaskCardModel[] | MerchantTaskCardModel[]
) => ({
  creatorTasks:
    session?.activeRole === "creator"
      ? ((initialTasks as CreatorTaskCardModel[] | undefined) ?? [])
      : [],
  merchantTasks:
    session?.activeRole === "merchant"
      ? ((initialTasks as MerchantTaskCardModel[] | undefined) ?? [])
      : []
});

function RoutedApp({
  session,
  initialSession,
  initialTasks,
  bootstrapSession = false
}: AppProps) {
  const seedSession = initialSession ?? session ?? null;
  const seedTaskState = getInitialTaskState(seedSession, initialTasks);
  const [currentSession, setCurrentSession] = useState<WebSession | null>(seedSession);
  const [creatorTasks, setCreatorTasks] = useState(seedTaskState.creatorTasks);
  const [merchantTasks, setMerchantTasks] = useState(seedTaskState.merchantTasks);
  const [merchantTaskMetaById, setMerchantTaskMetaById] = useState<
    Record<string, MerchantTaskLocalMetaModel>
  >({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!bootstrapSession || seedSession) {
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);

      try {
        const sessionPayload = await getSession();

        if (!sessionPayload || cancelled) {
          return;
        }

        const nextSession = normalizeWebSession(sessionPayload);
        const nextTaskState = await loadSurfaceTasks(
          nextSession,
          merchantTaskMetaById
        );

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setCurrentSession(nextSession);
          setCreatorTasks(nextTaskState.creatorTasks);
          setMerchantTasks(nextTaskState.merchantTasks);
          setStatusMessage(undefined);
        });
      } catch {
        if (!cancelled) {
          setStatusMessage("会话恢复失败，请重新登录。");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [bootstrapSession, seedSession]);

  const handleLogin = async (input: {
    identifier: string;
    secret: string;
    client: "web";
  }) => {
    setLoading(true);
    setStatusMessage(undefined);

    try {
      const response = await login(input);
      const nextSession = normalizeWebSession(response);
      const nextTaskState = await loadSurfaceTasks(nextSession, merchantTaskMetaById);

      startTransition(() => {
        setCurrentSession(nextSession);
        setCreatorTasks(nextTaskState.creatorTasks);
        setMerchantTasks(nextTaskState.merchantTasks);
      });
    } catch {
      setStatusMessage("登录失败，请检查演示账号或后端配置。");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRole = async (
    role: WebRole,
    targetPath = defaultPathForRole(role)
  ) => {
    if (!currentSession || loading || role === currentSession.activeRole) {
      return;
    }

    setLoading(true);
    setStatusMessage(undefined);

    try {
      const response = await switchRole(role);
      const nextSession = normalizeWebSession(response, currentSession.user);
      const nextTaskState = await loadSurfaceTasks(nextSession, merchantTaskMetaById);

      startTransition(() => {
        setCurrentSession(nextSession);
        setCreatorTasks(nextTaskState.creatorTasks);
        setMerchantTasks(nextTaskState.merchantTasks);
      });
      navigate(targetPath, { replace: true });
    } catch {
      setStatusMessage("角色切换失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  if (!currentSession) {
    return (
      <LoginPage
        loading={loading}
        errorMessage={statusMessage}
        onSubmit={handleLogin}
      />
    );
  }

  const headerActions = (
    <div className="top-bar__actions">
      {loading ? (
        <span className="status-message">正在同步角色视图...</span>
      ) : (
        <RoleSwitch
          roles={currentSession.roles}
          activeRole={currentSession.activeRole}
          onSwitch={(role) => void handleSwitchRole(role)}
        />
      )}
      {statusMessage ? <span className="error-message">{statusMessage}</span> : null}
    </div>
  );

  if (currentSession.activeRole === "merchant" && isCreatorTabPath(location.pathname)) {
    return <Navigate to="/merchant/task-create" replace />;
  }

  if (
    currentSession.activeRole === "creator" &&
    location.pathname.startsWith("/merchant/")
  ) {
    return <Navigate to="/tasks" replace />;
  }

  const CreatorTaskFeedRoute = () => {
    const [cards, setCards] = useState<CreatorSubmissionCardModel[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
      let cancelled = false;

      const load = async () => {
        try {
          const submissions = await listCreatorSubmissions();

          if (cancelled) {
            return;
          }

          setCards(submissions.map(mapCreatorSubmissionCard));
          setErrorMessage(undefined);
        } catch {
          if (!cancelled) {
            setCards([]);
            setErrorMessage("我的投稿加载失败");
          }
        }
      };

      void load();

      return () => {
        cancelled = true;
      };
    }, []);

    return (
      <CreatorTaskFeedPage
        cards={cards}
        errorMessage={errorMessage}
        onTaskTap={(taskId) => navigate(`/creator/task/${taskId}`)}
      />
    );
  };

  const CreatorTaskDetailRoute = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const [task, setTask] = useState<CreatorTaskDetailModel | null>(null);
    const [submissionCards, setSubmissionCards] = useState<CreatorSubmissionCardModel[]>([]);
    const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>();
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const loadTaskDetail = async () => {
      if (!taskId) {
        setTask(null);
        setSubmissionCards([]);
        setErrorMessage("请先从任务池选择任务。");
        return;
      }

      try {
        const [taskDetail, submissions] = await Promise.all([
          fetchCreatorTaskDetail(taskId),
          listCreatorTaskSubmissions(taskId)
        ]);

        setTask(mapCreatorTaskDetail(taskDetail));
        setSubmissionCards(submissions.map(mapCreatorSubmissionCard));
        setErrorMessage(undefined);
      } catch {
        setTask(null);
        setSubmissionCards([]);
        setErrorMessage("任务详情加载失败");
      }
    };

    useEffect(() => {
      void loadTaskDetail();
    }, [taskId]);

    return (
      <CreatorTaskDetailPage
        task={task}
        submissionCards={submissionCards}
        feedbackMessage={feedbackMessage}
        errorMessage={errorMessage}
        onSubmitTap={() => {
          if (taskId) {
            navigate(`/creator/submission-edit?taskId=${taskId}`);
          }
        }}
        onEditTap={(submissionId) => {
          if (taskId) {
            navigate(
              `/creator/submission-edit?taskId=${taskId}&submissionId=${submissionId}`
            );
          }
        }}
        onWithdrawTap={(submissionId) => {
          void (async () => {
            try {
              await withdrawCreatorSubmission(submissionId);
              await loadTaskDetail();
              setFeedbackMessage("投稿已撤回");
              setErrorMessage(undefined);
            } catch {
              setFeedbackMessage(undefined);
              setErrorMessage("撤回失败");
            }
          })();
        }}
      />
    );
  };

  const CreatorSubmissionEditorRoute = () => {
    const routeLocation = useLocation();
    const searchParams = new URLSearchParams(routeLocation.search);
    const taskId = searchParams.get("taskId") ?? "";
    const submissionId = searchParams.get("submissionId") ?? "";
    const [task, setTask] = useState<CreatorTaskDetailModel | null>(null);
    const [submitLabel, setSubmitLabel] = useState("提交作品");
    const [form, setForm] = useState({
      assetUrl: "https://example.com/demo.mp4",
      description: "原生小程序投稿示例"
    });
    const [resultMessage, setResultMessage] = useState<string | undefined>();
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [submitting, setSubmitting] = useState(false);
    const [editGuard, setEditGuard] = useState<"missing" | "nonEditable" | null>(
      null
    );

    useEffect(() => {
      let cancelled = false;

      const load = async () => {
        if (!taskId) {
          setTask(null);
          setSubmitLabel(submissionId ? "保存修改" : "提交作品");
          setErrorMessage("请先从任务池选择任务。");
          setEditGuard(null);
          return;
        }

        try {
          const taskDetail = mapCreatorTaskDetail(await fetchCreatorTaskDetail(taskId));
          const taskSubmissions = submissionId
            ? await listCreatorTaskSubmissions(taskId)
            : [];
          const targetSubmission = submissionId
            ? taskSubmissions.find((item) => item.id === submissionId) ?? null
            : null;

          if (cancelled) {
            return;
          }

          setTask(taskDetail);
          setResultMessage(undefined);
          setSubmitLabel(submissionId ? "保存修改" : "提交作品");

          if (submissionId && !targetSubmission) {
            setErrorMessage("投稿不存在");
            setEditGuard("missing");
            return;
          }

          if (targetSubmission) {
            setForm({
              assetUrl: targetSubmission.assetUrl,
              description: targetSubmission.description
            });

            if (targetSubmission.status !== "submitted") {
              setErrorMessage("当前投稿不可修改");
              setEditGuard("nonEditable");
              return;
            }
          }

          setErrorMessage(undefined);
          setEditGuard(null);
        } catch {
          if (!cancelled) {
            setTask(null);
            setErrorMessage("任务信息加载失败");
            setEditGuard(null);
          }
        }
      };

      void load();

      return () => {
        cancelled = true;
      };
    }, [taskId, submissionId]);

    return (
      <SubmissionEditorPage
        task={task}
        submissionId={submissionId}
        submitLabel={submitLabel}
        form={form}
        resultMessage={resultMessage}
        errorMessage={errorMessage}
        submitting={submitting}
        onFieldInput={(field, value) => {
          setForm((current) => ({ ...current, [field]: value }));
          setResultMessage(undefined);
          if (!submissionId || !editGuard) {
            setErrorMessage(undefined);
          }
        }}
        onSubmitTap={() => {
          void (async () => {
            if (!task) {
              setResultMessage(undefined);
              setErrorMessage("请先从任务池选择任务。");
              return;
            }

            if (!task.canSubmit) {
              setResultMessage(undefined);
              setErrorMessage("当前任务不可投稿");
              return;
            }

            if (submissionId && editGuard) {
              setResultMessage(undefined);
              setErrorMessage(
                editGuard === "missing" ? "投稿不存在" : "当前投稿不可修改"
              );
              return;
            }

            setSubmitting(true);

            try {
              if (submissionId) {
                await updateCreatorSubmission(submissionId, form);
                setResultMessage("投稿已更新");
              } else {
                await createCreatorSubmission(task.id, form);
                setResultMessage("投稿已提交");
              }

              setErrorMessage(undefined);
            } catch {
              setResultMessage(undefined);
              setErrorMessage("投稿失败");
            } finally {
              setSubmitting(false);
            }
          })();
        }}
      />
    );
  };

  const CreatorWalletRoute = () => {
    const [cards, setCards] = useState<WalletMetricModel[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
      let cancelled = false;

      const load = async () => {
        try {
          const snapshot = await getCreatorWallet();

          if (cancelled) {
            return;
          }

          setCards(mapCreatorWalletMetrics(snapshot));
          setErrorMessage(undefined);
        } catch {
          if (!cancelled) {
            setCards([]);
            setErrorMessage("收益明细加载失败");
          }
        }
      };

      void load();

      return () => {
        cancelled = true;
      };
    }, []);

    return (
      <WalletPage
        title="收益明细"
        summary="查看冻结收益、可提现金额和本周新增"
        cards={cards}
        errorMessage={errorMessage}
      />
    );
  };

  const CreatorEarningsRoute = () => {
    const [cards, setCards] = useState<WalletMetricModel[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
      let cancelled = false;

      const load = async () => {
        try {
          const snapshot = await getCreatorWallet();

          if (cancelled) {
            return;
          }

          setCards(mapCreatorWalletMetrics(snapshot));
          setErrorMessage(undefined);
        } catch {
          if (!cancelled) {
            setCards([]);
            setErrorMessage("收益明细加载失败");
          }
        }
      };

      void load();

      return () => {
        cancelled = true;
      };
    }, []);

    return <CreatorEarningsPage cards={cards} errorMessage={errorMessage} />;
  };

  const MerchantTasksRoute = () => (
    <MerchantTasksPage
      tasks={merchantTasks}
      onTaskTap={(taskId) => navigate(`/merchant/task-detail/${taskId}`)}
    />
  );

  const MerchantTaskCreateRoute = () => {
    const [publishing, setPublishing] = useState(false);
    const [publishStatus, setPublishStatus] = useState<string | undefined>();
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const handlePublish = async (form: MerchantTaskCreateFormModel) => {
      setPublishing(true);
      setPublishStatus(undefined);
      setErrorMessage(undefined);

      let publishedTaskId = "";
      let nextTaskMetaById: Record<string, MerchantTaskLocalMetaModel> =
        merchantTaskMetaById;

      try {
        const draft = await createMerchantTaskDraft();
        const published = await publishMerchantTask(draft.taskId);
        const taskMeta = buildMerchantTaskMetaFromForm(form);
        publishedTaskId = published.id;
        nextTaskMetaById = {
          ...merchantTaskMetaById,
          [published.id]: taskMeta
        };

        setMerchantTaskMetaById(nextTaskMetaById);
        setMerchantTasks((current) => {
          const nextCard: MerchantTaskCardModel = {
            id: published.id,
            title: taskMeta.title,
            submissionCount: 0,
            statusText: "征集中"
          };

          if (current.some((item) => item.id === published.id)) {
            return current.map((item) => (item.id === published.id ? nextCard : item));
          }

          return [nextCard, ...current];
        });
        setPublishStatus(
          `任务 ${published.id} 已发布，已锁定预算 ${
            form.baseAmount * form.baseCount + form.rankingTotal
          }`
        );
        navigate(`/merchant/task-detail/${published.id}`);
      } catch {
        setErrorMessage("发布失败，请确认 API 已启动");
        setPublishing(false);
        return;
      }

      try {
        const nextTaskState = mapMerchantTasks(
          await listMerchantTasks(),
          nextTaskMetaById
        );
        setMerchantTasks(nextTaskState);
      } catch {
        if (publishedTaskId) {
          setErrorMessage(undefined);
        }
      } finally {
        setPublishing(false);
      }
    };

    return (
      <MerchantTaskCreatePage
        publishing={publishing}
        publishStatus={publishStatus}
        errorMessage={errorMessage}
        onPublish={(form) => {
          void handlePublish(form);
        }}
      />
    );
  };

  const MerchantTaskDetailRoute = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const resolvedTaskId = taskId ?? merchantTasks[0]?.id;
    const [task, setTask] = useState<MerchantTaskDetailModel | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
      if (!resolvedTaskId) {
        setTask(null);
        setErrorMessage(undefined);
        return;
      }

      let cancelled = false;

      const load = async () => {
        try {
          const detail = await getMerchantTaskDetail(resolvedTaskId);

          if (cancelled) {
            return;
          }

          setTask(mapMerchantTaskDetail(detail, merchantTaskMetaById));
          setErrorMessage(undefined);
        } catch {
          if (!cancelled) {
            setTask(null);
            setErrorMessage("任务详情加载失败");
          }
        }
      };

      void load();

      return () => {
        cancelled = true;
      };
    }, [resolvedTaskId, merchantTaskMetaById]);

    return (
      <MerchantTaskDetailPage
        task={task}
        errorMessage={errorMessage}
        onOpenReview={() => {
          if (resolvedTaskId) {
            navigate(`/merchant/review/${resolvedTaskId}`);
          }
        }}
        onOpenSettlement={() => {
          if (resolvedTaskId) {
            navigate(`/merchant/settlement/${resolvedTaskId}`);
          }
        }}
      />
    );
  };

  const MerchantReviewRoute = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const [task, setTask] = useState<{ title: string; rewardText: string } | null>(null);
    const [cards, setCards] = useState<MerchantReviewCardModel[]>([]);
    const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>();
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [actionPending, setActionPending] = useState(false);
    const actionInFlightRef = useRef(false);

    const load = async () => {
      if (!taskId) {
        setTask(null);
        setCards([]);
        setErrorMessage("请先选择任务。");
        return;
      }

      try {
        const [taskDetail, submissions] = await Promise.all([
          getMerchantTaskDetail(taskId),
          listMerchantTaskSubmissions(taskId)
        ]);
        const detailModel = mapMerchantTaskDetail(taskDetail, merchantTaskMetaById);

        setTask({
          title: detailModel.title,
          rewardText: detailModel.rewardText
        });
        setCards(submissions.map(mapMerchantReviewCard));
        setErrorMessage(undefined);
      } catch {
        setTask(null);
        setCards([]);
        setErrorMessage("审核列表加载失败");
      }
    };

    useEffect(() => {
      void load();
    }, [taskId, merchantTaskMetaById]);

    const runMutation = async (
      submissionId: string,
      action: "approve" | "tip" | "ranking"
    ) => {
      if (!taskId || actionInFlightRef.current) {
        return;
      }

      actionInFlightRef.current = true;
      setActionPending(true);

      try {
        if (action === "approve") {
          await reviewMerchantSubmission(submissionId, "approved");
          setFeedbackMessage("已审核通过并冻结基础奖");
        } else if (action === "tip") {
          await tipMerchantSubmission(submissionId);
          setFeedbackMessage("已追加打赏");
        } else {
          await addMerchantRankingReward(taskId, submissionId);
          setFeedbackMessage("已发放排名奖");
        }

        setErrorMessage(undefined);
        await load();
      } catch {
        setFeedbackMessage(undefined);
        setErrorMessage("审核动作失败");
      } finally {
        actionInFlightRef.current = false;
        setActionPending(false);
      }
    };

    return (
      <MerchantReviewPage
        task={task}
        cards={cards}
        feedbackMessage={feedbackMessage}
        errorMessage={errorMessage}
        actionPending={actionPending}
        onApprove={(submissionId) => {
          void runMutation(submissionId, "approve");
        }}
        onTip={(submissionId) => {
          void runMutation(submissionId, "tip");
        }}
        onRanking={(submissionId) => {
          void runMutation(submissionId, "ranking");
        }}
      />
    );
  };

  const MerchantSettlementRoute = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const [settlement, setSettlement] = useState<MerchantSettlementModel | null>(
      null
    );
    const [resultMessage, setResultMessage] = useState<string | undefined>();
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [settling, setSettling] = useState(false);

    const load = async (options?: { suppressError?: boolean }) => {
      if (!taskId) {
        setSettlement(null);
        setErrorMessage("请先选择任务。");
        return;
      }

      try {
        const [taskDetail, submissions] = await Promise.all([
          getMerchantTaskDetail(taskId),
          listMerchantTaskSubmissions(taskId)
        ]);

        setSettlement(
          buildMerchantSettlementSummary(
            mapMerchantTaskDetail(taskDetail, merchantTaskMetaById),
            submissions
          )
        );
        setErrorMessage(undefined);
      } catch {
        if (!options?.suppressError) {
          setSettlement(null);
          setErrorMessage("结算信息加载失败");
        }
      }
    };

    useEffect(() => {
      void load();
    }, [taskId, merchantTaskMetaById]);

    const handleSettle = async () => {
      if (!taskId) {
        return;
      }

      setSettling(true);

      let response: Awaited<ReturnType<typeof settleMerchantTask>> | null = null;

      try {
        response = await settleMerchantTask(taskId);
        setResultMessage(`任务 ${response.taskId} 已结算`);
        setErrorMessage(undefined);
        setSettlement((current) =>
          current ?? {
            title: "待结算任务",
            submittedCount: 0,
            approvedCount: 0,
            rewardPreview: []
          }
        );
      } catch {
        setResultMessage(undefined);
        setErrorMessage("结算失败");
        setSettling(false);
        return;
      }

      setSettlement((current) =>
        current
          ? {
              ...current,
              rewardPreview: [
                `创作者可提现 +${response.creatorAvailableDelta}`,
                `商家退款 +${response.merchantRefundDelta}`
              ]
            }
          : current
      );

      await load({ suppressError: true });

      try {
        const nextTaskState = mapMerchantTasks(
          await listMerchantTasks(),
          merchantTaskMetaById
        );
        setMerchantTasks(nextTaskState);
      } catch {
        setErrorMessage(undefined);
      } finally {
        setSettling(false);
      }
    };

    return (
      <MerchantSettlementPage
        settlement={settlement}
        resultMessage={resultMessage}
        errorMessage={errorMessage}
        settling={settling}
        onSettle={() => {
          void handleSettle();
        }}
      />
    );
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={defaultPathForRole(currentSession.activeRole)} replace />
        }
      />
      <Route
        path="/tasks"
        element={
          <MobileShell
            header={
              <TopBar
                title={currentSession.user.displayName}
                actions={headerActions}
              />
            }
            tabs={<BottomTabBar />}
          >
            <CreatorHomePage
              channels={[...creatorLobbyChannels]}
              activeChannel="推荐"
              tasks={creatorTasks}
              onTaskTap={(taskId) => navigate(`/creator/task/${taskId}`)}
            />
          </MobileShell>
        }
      />
      <Route
        path="/workspace"
        element={
          <MobileShell
            header={
              <TopBar
                title={currentSession.user.displayName}
                actions={headerActions}
              />
            }
            tabs={<BottomTabBar />}
          >
            <AwardsPage />
          </MobileShell>
        }
      />
      <Route
        path="/profile"
        element={
          <MobileShell
            header={
              <TopBar
                title={currentSession.user.displayName}
                actions={headerActions}
              />
            }
            tabs={<BottomTabBar />}
          >
            <ProfilePage
              currentRole={currentSession.activeRole}
              onQuickLinkTap={(path) => {
                if (path !== "/creator/submission-edit") {
                  navigate(path);
                  return;
                }

                const creatorTaskId = creatorTasks[0]?.id;

                if (creatorTaskId) {
                  navigate(`/creator/submission-edit?taskId=${creatorTaskId}`);
                  return;
                }

                navigate(path);
              }}
              onEnterMerchant={() =>
                void handleSwitchRole("merchant", "/merchant/task-create")
              }
            />
          </MobileShell>
        }
      />
      <Route
        path="/creator/task-feed"
        element={
          <MobileShell
            header={
              <TopBar
                title="我的投稿"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <CreatorTaskFeedRoute />
          </MobileShell>
        }
      />
      <Route
        path="/creator/task/:taskId"
        element={
          <MobileShell
            header={
              <TopBar
                title="任务详情"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <CreatorTaskDetailRoute />
          </MobileShell>
        }
      />
      <Route
        path="/creator/submission-edit"
        element={
          <MobileShell
            header={
              <TopBar
                title="编辑投稿"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <CreatorSubmissionEditorRoute />
          </MobileShell>
        }
      />
      <Route
        path="/wallet"
        element={
          <MobileShell
            header={
              <TopBar
                title="收益明细"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <CreatorWalletRoute />
          </MobileShell>
        }
      />
      <Route
        path="/creator/earnings"
        element={
          <MobileShell
            header={
              <TopBar
                title="收益明细"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <CreatorEarningsRoute />
          </MobileShell>
        }
      />
      <Route
        path="/merchant/tasks"
        element={
          <MobileShell
            header={
              <TopBar
                title="任务管理"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <MerchantTasksRoute />
          </MobileShell>
        }
      />
      <Route
        path="/merchant/task-create"
        element={
          <MobileShell
            header={
              <TopBar
                title="发布任务"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <MerchantTaskCreateRoute />
          </MobileShell>
        }
      />
      <Route
        path="/merchant/task-detail"
        element={
          <MobileShell
            header={
              <TopBar
                title="任务详情"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <MerchantTaskDetailRoute />
          </MobileShell>
        }
      />
      <Route
        path="/merchant/task-detail/:taskId"
        element={
          <MobileShell
            header={
              <TopBar
                title="任务详情"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <MerchantTaskDetailRoute />
          </MobileShell>
        }
      />
      <Route
        path="/merchant/review/:taskId"
        element={
          <MobileShell
            header={
              <TopBar
                title="稿件审核"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <MerchantReviewRoute />
          </MobileShell>
        }
      />
      <Route
        path="/merchant/settlement/:taskId"
        element={
          <MobileShell
            header={
              <TopBar
                title="任务结算"
                onBack={() => navigate(-1)}
                actions={headerActions}
              />
            }
          >
            <MerchantSettlementRoute />
          </MobileShell>
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={defaultPathForRole(currentSession.activeRole)} replace />
        }
      />
    </Routes>
  );
}

export default function App(props: AppProps) {
  const inRouterContext = useInRouterContext();

  if (!inRouterContext) {
    return (
      <MemoryRouter initialEntries={["/"]}>
        <RoutedApp {...props} />
      </MemoryRouter>
    );
  }

  return <RoutedApp {...props} />;
}

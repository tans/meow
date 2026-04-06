import type {
  CreatorSubmissionItem,
  CreatorTaskDetail,
  CreatorTaskFeedItem,
  CreatorWalletSnapshot,
  MerchantTaskAttachment,
  MerchantTaskDetail,
  MerchantTaskListItem,
  SubmissionReadModelItem
} from "@meow/contracts";

export interface CreatorTaskCardModel {
  id: string;
  title: string;
  brandName: string;
  summary: string;
  rewardText: string;
  metaText: string;
  highlightTag: string;
}

export interface CreatorTaskDetailModel {
  id: string;
  title: string;
  status: CreatorTaskDetail["status"];
  rewardText: string;
  creatorSubmissionCount: number;
  canSubmit: boolean;
}

export interface CreatorSubmissionCardModel {
  submissionId: string;
  taskId: string;
  title: string;
  statusText: string;
  rewardTag: string;
  canEdit: boolean;
  canWithdraw: boolean;
}

export interface WalletMetricModel {
  label: string;
  value: string;
}

export interface AwardsFilterModel {
  label: string;
  value: string;
  active: boolean;
}

export interface AwardsCardModel {
  id: string;
  badge: string;
  title: string;
  creatorName: string;
  taskName: string;
  resultText: string;
  actionText: string;
}

export interface AwardsPageModel {
  title: string;
  featuredTitle: string;
  featuredDescription: string;
  periods: AwardsFilterModel[];
  categories: AwardsFilterModel[];
  featuredCards: AwardsCardModel[];
}

export interface ProfileQuickLinkModel {
  title: string;
  path: string;
}

export interface CreatorStatModel {
  label: string;
  value: string;
}

export interface ProfilePageModel {
  title: string;
  creatorName: string;
  creatorBio: string;
  creatorTags: string[];
  creatorStatus: string;
  stats: CreatorStatModel[];
  quickLinks: ProfileQuickLinkModel[];
  merchantEntry: {
    title: string;
    description: string;
    actionText: string;
  };
}

export interface MerchantTaskCardModel {
  id: string;
  title: string;
  submissionCount: number;
  statusText: string;
}

export interface MerchantTaskCreateFormModel {
  title: string;
  baseAmount: number;
  baseCount: number;
  rankingTotal: number;
  assetAttachments: MerchantTaskAttachment[];
}

export interface MerchantTaskLocalMetaModel {
  title: string;
  rewardText: string;
  lockedBudgetText: string;
}

export interface MerchantTaskDetailModel {
  id: string;
  title: string;
  statusText: string;
  rewardText: string;
  submissionCount: number;
  lockedBudgetText: string;
  rewardTags: string[];
  assetAttachments: MerchantTaskAttachment[];
}

export interface MerchantReviewCardModel {
  submissionId: string;
  creatorText: string;
  statusText: string;
  rewardTag: string;
  canApprove: boolean;
  canTip: boolean;
  canRanking: boolean;
}

export interface MerchantSettlementModel {
  title: string;
  submittedCount: number;
  approvedCount: number;
  rewardPreview: string[];
}

const taskStatusText: Record<MerchantTaskListItem["status"], string> = {
  draft: "草稿中",
  published: "征集中",
  paused: "已暂停",
  ended: "已截止",
  settled: "已结算",
  closed: "已关闭"
};

const taskTitleById: Record<string, string> = {
  "task-1": "春季穿搭口播征稿",
  "task-2": "春日护肤精华试用征稿",
  "task-3": "家居收纳前后对比征集"
};

const merchantLabelById: Record<string, string> = {
  "merchant-1": "奈雪",
  "merchant-2": "PMPM",
  "merchant-3": "木墨"
};

const lobbyMetaByTaskId: Record<
  string,
  Pick<CreatorTaskCardModel, "brandName" | "summary" | "metaText" | "highlightTag">
> = {
  "task-1": {
    brandName: "奈雪",
    summary: "到店拍摄 15 秒短视频，突出新品和门店氛围",
    metaText: "126 人参与 · 距截止 3 天",
    highlightTag: "平台精选"
  },
  "task-2": {
    brandName: "PMPM",
    summary: "记录精华上脸质感，突出真实肤感变化",
    metaText: "84 人参与 · 距截止 1 天",
    highlightTag: "奖金高"
  },
  "task-3": {
    brandName: "木墨",
    summary: "用图文笔记呈现收纳前后对比",
    metaText: "40 人参与 · 同城可约拍",
    highlightTag: "同城"
  }
};

const featuredAwardsCards: AwardsCardModel[] = [
  {
    id: "award-1",
    badge: "平台精选",
    title: "春日探店短视频",
    creatorName: "阿梨同学",
    taskName: "奈雪春季探店征稿",
    resultText: "品牌已采用 · 奖金 ¥500",
    actionText: "查看案例"
  },
  {
    id: "award-2",
    badge: "一等奖",
    title: "通勤穿搭图文笔记",
    creatorName: "Momo穿搭",
    taskName: "都市白领穿搭征集",
    resultText: "一等奖 · 奖金 ¥800",
    actionText: "查看案例"
  }
];

const resolveTaskTitle = (taskId: string): string =>
  taskTitleById[taskId] ?? `原生任务 ${taskId}`;

const resolveMerchantLabel = (merchantId: string): string =>
  merchantLabelById[merchantId] ?? `需求方 ${merchantId}`;

const statusTextBySubmissionStatus: Record<CreatorSubmissionItem["status"], string> = {
  submitted: "待审核",
  approved: "已通过",
  rejected: "已驳回",
  withdrawn: "已撤回"
};

export const creatorLobbyChannels = ["推荐", "品牌合作", "急单", "同城"] as const;

export const mapCreatorTasks = (
  tasks: CreatorTaskFeedItem[]
): CreatorTaskCardModel[] =>
  tasks.map((task) => {
    const fallbackMetaText = `0 人参与 · ${
      task.status === "published" ? "长期征稿" : "已截止"
    }`;
    const presetMeta = lobbyMetaByTaskId[task.id];

    return {
      id: task.id,
      title: resolveTaskTitle(task.id),
      brandName: presetMeta?.brandName ?? resolveMerchantLabel(task.merchantId),
      summary: presetMeta?.summary ?? "查看任务详情和奖励规则",
      rewardText: "基础奖 1 x 2 + 排名奖 1",
      metaText: presetMeta?.metaText ?? fallbackMetaText,
      highlightTag:
        presetMeta?.highlightTag ?? (task.status === "published" ? "新发布" : "已截止")
    };
  });

export const mapCreatorTaskDetail = (
  task: CreatorTaskDetail
): CreatorTaskDetailModel => ({
  id: task.id,
  title: resolveTaskTitle(task.id),
  status: task.status,
  rewardText: "基础奖 1 x 2 + 排名奖 1",
  creatorSubmissionCount: task.creatorSubmissionCount,
  canSubmit: task.status === "published"
});

export const mapCreatorSubmissionCard = (
  submission: CreatorSubmissionItem
): CreatorSubmissionCardModel => ({
  submissionId: submission.id,
  taskId: submission.taskId,
  title: `投稿 ${submission.id}`,
  statusText: statusTextBySubmissionStatus[submission.status],
  rewardTag:
    submission.rewardTags.length > 0
      ? submission.rewardTags.join("/")
      : statusTextBySubmissionStatus[submission.status],
  canEdit: submission.status === "submitted",
  canWithdraw: submission.status === "submitted"
});

export const mapCreatorWalletMetrics = (
  snapshot: CreatorWalletSnapshot
): WalletMetricModel[] => [
  { label: "冻结收益", value: `¥${snapshot.frozenAmount}` },
  { label: "可提现", value: `¥${snapshot.availableAmount}` },
  { label: "累计投稿", value: `${snapshot.submissionCount}` }
];

export const buildAwardsModel = (
  activePeriod = "本周",
  activeCategory = "全部"
): AwardsPageModel => {
  const periods = ["本周", "本月", "全部"];
  const categories = ["全部", "美妆", "探店", "穿搭", "家居"];

  return {
    title: "获奖作品",
    featuredTitle: "本周品牌精选",
    featuredDescription: "看见真实获奖案例，理解平台偏好",
    periods: periods.map((label) => ({
      label,
      value: label,
      active: label === activePeriod
    })),
    categories: categories.map((label) => ({
      label,
      value: label,
      active: label === activeCategory
    })),
    featuredCards: featuredAwardsCards
  };
};

export const buildProfileModel = (): ProfilePageModel => ({
  title: "我的",
  creatorName: "阿喵创作社",
  creatorBio: "探店 / 美妆 / 穿搭创作者",
  creatorTags: ["探店", "美妆", "穿搭"],
  creatorStatus: "本周已投 6 个任务，入围 2 个",
  stats: [
    { label: "累计获奖", value: "12" },
    { label: "本月投稿", value: "18" },
    { label: "品牌合作", value: "6" },
    { label: "预估收益", value: "¥1,280" }
  ],
  quickLinks: [
    { title: "我的投稿", path: "/creator/task-feed" },
    { title: "收益明细", path: "/wallet" },
    { title: "合作记录", path: "/creator/earnings" }
  ],
  merchantEntry: {
    title: "发布需求",
    description: "需要发起品牌合作需求时，从这里进入需求侧管理",
    actionText: "进入需求侧"
  }
});

export const mapMerchantTasks = (
  tasks: MerchantTaskListItem[],
  taskMetaById: Record<string, MerchantTaskLocalMetaModel> = {}
): MerchantTaskCardModel[] =>
  tasks.map((task) => ({
    id: task.id,
    title: task.title || taskMetaById[task.id]?.title || resolveTaskTitle(task.id),
    submissionCount: task.submissionCount,
    statusText: taskStatusText[task.status]
  }));

const statusTextByMerchantSubmissionStatus: Record<
  SubmissionReadModelItem["status"],
  string
> = {
  submitted: "待审核",
  approved: "已通过",
  rejected: "已驳回",
  withdrawn: "已撤回"
};

export const buildBudgetSummary = (input: {
  baseAmount: number;
  baseCount: number;
  rankingTotal: number;
}) => ({
  lockedTotal: input.baseAmount * input.baseCount + input.rankingTotal
});

export const buildMerchantTaskMetaFromForm = (
  form: MerchantTaskCreateFormModel
): MerchantTaskLocalMetaModel => ({
  title: form.title,
  rewardText: `基础奖 ${form.baseAmount} x ${form.baseCount} + 排名奖 ${form.rankingTotal}`,
  lockedBudgetText: `¥${buildBudgetSummary(form).lockedTotal}`
});

export const mapMerchantTaskDetail = (
  task: MerchantTaskDetail,
  taskMetaById: Record<string, MerchantTaskLocalMetaModel> = {}
): MerchantTaskDetailModel => ({
  id: task.id,
  title: task.title || taskMetaById[task.id]?.title || resolveTaskTitle(task.id),
  statusText: taskStatusText[task.status],
  rewardText:
    taskMetaById[task.id]?.rewardText ??
    (task.rewardTags.length > 0 ? task.rewardTags.join("/") : "基础奖+排名奖"),
  submissionCount: task.submissionCount,
  lockedBudgetText:
    taskMetaById[task.id]?.lockedBudgetText ?? `¥${task.escrowLockedAmount}`,
  rewardTags: task.rewardTags,
  assetAttachments: task.assetAttachments ?? []
});

export const mapMerchantReviewCard = (
  submission: SubmissionReadModelItem
): MerchantReviewCardModel => ({
  submissionId: submission.id,
  creatorText: `创作者 ${submission.creatorId}`,
  statusText: statusTextByMerchantSubmissionStatus[submission.status],
  rewardTag:
    submission.rewardTags.length > 0
      ? submission.rewardTags.join("/")
      : statusTextByMerchantSubmissionStatus[submission.status],
  canApprove: submission.status === "submitted",
  canTip: submission.status !== "withdrawn",
  canRanking: submission.status !== "withdrawn"
});

export const buildMerchantSettlementSummary = (
  task: MerchantTaskDetailModel | null,
  submissions: SubmissionReadModelItem[]
): MerchantSettlementModel => ({
  title: task?.title ?? "待结算任务",
  submittedCount: submissions.length,
  approvedCount: submissions.filter((item) => item.status === "approved").length,
  rewardPreview: submissions
    .filter((item) => item.rewardTags.length > 0)
    .map((item) => item.rewardTags.join("/"))
});

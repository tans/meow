import { request } from "./http.js";
import { getStore } from "./store.js";

const communityTaskMetaById = {
  "task-1": {
    brandName: "奈雪",
    category: "探店",
    summary: "到店拍摄 15 秒短视频，突出新品和门店氛围",
    participantCount: 126,
    deadlineText: "距截止 3 天",
    highlightTag: "平台精选",
    coverTheme: "peach"
  },
  "task-2": {
    brandName: "PMPM",
    category: "美妆",
    summary: "记录精华上脸质感，突出真实肤感变化",
    participantCount: 84,
    deadlineText: "距截止 1 天",
    highlightTag: "奖金高",
    coverTheme: "rose"
  },
  "task-3": {
    brandName: "木墨",
    category: "家居",
    summary: "用图文笔记呈现收纳前后对比",
    participantCount: 40,
    deadlineText: "同城可约拍",
    highlightTag: "同城",
    coverTheme: "mint"
  }
};

const getApiBaseUrl = () => {
  const app = getApp();
  return app.globalData.apiBaseUrl;
};

const merchantHeader = () => ({
  "content-type": "application/json",
  "x-demo-user": "merchant-1"
});

const creatorHeader = () => ({
  "content-type": "application/json",
  "x-demo-user": "creator-1"
});

const getRewardText = (input) =>
  `基础奖 ${input.baseAmount} x ${input.baseCount} + 排名奖 ${input.rankingTotal}`;

const getTaskTitle = (taskId) => `原生任务 ${taskId}`;

const getCommunityMeta = (taskId) =>
  communityTaskMetaById[taskId] || {
    brandName: "品牌合作",
    category: "推荐",
    summary: "查看任务详情和奖励规则",
    participantCount: 0,
    deadlineText: "长期征稿",
    highlightTag: "新发布",
    coverTheme: "sand"
  };

export const buildPublicTaskListItem = (task, meta = {}) => {
  const communityMeta = getCommunityMeta(task.id);
  const lobbyTask = {
    ...task,
    ...communityMeta
  };

  return {
    ...lobbyTask,
    title: meta.title || lobbyTask.title || getTaskTitle(task.id),
    rewardText: meta.rewardText || lobbyTask.rewardText || "基础奖+排名奖"
  };
};

export const mergeCreatorTaskDetail = (task, meta = {}) => ({
  id: task.id,
  merchantId: task.merchantId,
  title: meta.title || getTaskTitle(task.id),
  status: task.status,
  rewardText: meta.rewardText || "基础奖+排名奖",
  creatorSubmissionCount: task.creatorSubmissionCount || 0,
  canSubmit: task.status === "published"
});

export const createMerchantTaskDraft = async (input) => {
  const response = await request({
    url: `${getApiBaseUrl()}/merchant/tasks`,
    method: "POST",
    data: {},
    header: merchantHeader()
  });

  const store = getStore();
  const meta = {
    id: response.taskId,
    title: input.title || getTaskTitle(response.taskId),
    rewardText: getRewardText(input),
    budgetSummary: {
      baseAmount: input.baseAmount,
      baseCount: input.baseCount,
      rankingTotal: input.rankingTotal,
      lockedTotal: input.baseAmount * input.baseCount + input.rankingTotal
    },
    status: response.status
  };

  store.taskMetaById[response.taskId] = meta;
  store.latestMerchantTask = meta;
  store.selectedTaskId = response.taskId;
  store.wallet.merchant.escrow = meta.budgetSummary.lockedTotal;
  store.wallet.merchant.refundPending = meta.budgetSummary.rankingTotal;

  return meta;
};

export const publishMerchantTask = async (taskId) => {
  const response = await request({
    url: `${getApiBaseUrl()}/merchant/tasks/${taskId}/publish`,
    method: "POST",
    header: merchantHeader()
  });

  const store = getStore();
  const meta = store.taskMetaById[taskId] || { id: taskId, title: getTaskTitle(taskId) };
  const publishedTask = {
    ...meta,
    id: response.id,
    merchantId: response.merchantId,
    status: response.status,
    ledgerEffect: response.ledgerEffect
  };

  store.taskMetaById[taskId] = publishedTask;
  store.latestMerchantTask = publishedTask;
  store.selectedTaskId = taskId;

  return publishedTask;
};

export const listPublicTasks = async () => {
  const items = await request({
    url: `${getApiBaseUrl()}/creator/tasks`,
    method: "GET",
    header: creatorHeader()
  });

  const store = getStore();

  return items.map((task) => buildPublicTaskListItem(task, store.taskMetaById[task.id] || {}));
};

export const getSelectedTask = async () => {
  const store = getStore();
  const selectedTaskId = store.selectedTaskId;

  if (!selectedTaskId) {
    return null;
  }

  const publicTasks = await listPublicTasks().catch(() => []);
  const publicTask = publicTasks.find((task) => task.id === selectedTaskId);
  const meta = store.taskMetaById[selectedTaskId];

  if (!publicTask && !meta) {
    return null;
  }

  return {
    id: selectedTaskId,
    title: meta?.title || publicTask?.title || getTaskTitle(selectedTaskId),
    status: meta?.status || publicTask?.status || "draft",
    rewardText: meta?.rewardText || publicTask?.rewardText || "基础奖+排名奖",
    budgetSummary: meta?.budgetSummary || null
  };
};

export const setSelectedTaskId = (taskId) => {
  const store = getStore();
  store.selectedTaskId = taskId;
  return store.selectedTaskId;
};

export const getLatestMerchantTask = () => {
  const store = getStore();
  return store.latestMerchantTask;
};

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
  "content-type": "application/json"
});

const creatorHeader = () => ({
  "content-type": "application/json"
});

const getRewardText = (input) =>
  `基础奖 ${input.baseAmount} x ${input.baseCount} + 排名奖 ${input.rankingTotal}`;

const getTaskTitle = (taskId) => `原生任务 ${taskId}`;

const fallbackThemes = ["sand", "peach", "rose", "mint"];

const pickFallbackTheme = (task) => {
  if (task.coverTheme) {
    return task.coverTheme;
  }

  const seed = `${task.id || ""}${task.title || ""}`;
  let sum = 0;

  for (let index = 0; index < seed.length; index += 1) {
    sum += seed.charCodeAt(index);
  }

  return fallbackThemes[sum % fallbackThemes.length];
};

export const mergePublicTaskForLobby = (task, meta = {}) => {
  const presetMeta = communityTaskMetaById[task.id];

  if (presetMeta) {
    return {
      ...task,
      ...presetMeta
    };
  }

  const title = meta.title || task.title || getTaskTitle(task.id);
  const participantCount =
    task.participantCount ?? task.creatorSubmissionCount ?? task.submissionCount ?? 0;
  const isOpen = task.status === "published";

  return {
    ...task,
    brandName: task.brandName || (task.merchantId ? `商家 ${task.merchantId}` : "品牌合作"),
    category: task.category || "推荐",
    summary: task.summary || `${title} 进行征稿，查看任务详情和奖励规则`,
    participantCount,
    deadlineText: task.deadlineText || (isOpen ? "长期征稿" : "已截止"),
    highlightTag: task.highlightTag || (isOpen ? "新发布" : "已截止"),
    coverTheme: pickFallbackTheme(task)
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

export const listMerchantTasks = async () => {
  const items = await request({
    url: `${getApiBaseUrl()}/merchant/tasks`,
    method: "GET",
    header: merchantHeader()
  });

  const store = getStore();

  return items.map((task) => {
    const meta = store.taskMetaById[task.id] || {};
    return {
      id: task.id,
      merchantId: task.merchantId,
      title: meta.title || getTaskTitle(task.id),
      status: task.status,
      rewardText: meta.rewardText || "基础奖+排名奖",
      budgetSummary:
        meta.budgetSummary ||
        {
          baseAmount: 0,
          baseCount: 0,
          rankingTotal: task.escrowLockedAmount,
          lockedTotal: task.escrowLockedAmount
        },
      escrowLockedAmount: task.escrowLockedAmount,
      submissionCount: task.submissionCount
    };
  });
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

export const buildPublicTaskListItem = (task, meta = {}) => {
  const lobbyTask = mergePublicTaskForLobby(task, meta);

  return {
    ...lobbyTask,
    id: lobbyTask.id,
    merchantId: lobbyTask.merchantId,
    title: meta.title || lobbyTask.title || getTaskTitle(task.id),
    status: lobbyTask.status,
    rewardText: meta.rewardText || lobbyTask.rewardText || "基础奖+排名奖"
  };
};

export const getSelectedTask = async () => {
  const store = getStore();
  const selectedTaskId = store.selectedTaskId;

  if (!selectedTaskId) {
    return null;
  }

  const [publicTasks, merchantTasks] = await Promise.all([
    listPublicTasks().catch(() => []),
    listMerchantTasks().catch(() => [])
  ]);
  const publicTask = publicTasks.find((task) => task.id === selectedTaskId);
  const merchantTask = merchantTasks.find((task) => task.id === selectedTaskId);
  const meta = store.taskMetaById[selectedTaskId];

  if (!publicTask && !merchantTask && !meta) {
    return null;
  }

  return {
    id: selectedTaskId,
    title:
      merchantTask?.title ||
      meta?.title ||
      publicTask?.title ||
      getTaskTitle(selectedTaskId),
    status:
      merchantTask?.status ||
      meta?.status ||
      publicTask?.status ||
      "draft",
    rewardText:
      merchantTask?.rewardText ||
      meta?.rewardText ||
      publicTask?.rewardText ||
      "基础奖+排名奖",
    budgetSummary: merchantTask?.budgetSummary || meta?.budgetSummary || null,
    submissionCount: merchantTask?.submissionCount || 0
  };
};

export const setSelectedTaskId = (taskId) => {
  const store = getStore();
  store.selectedTaskId = taskId;
  return store.selectedTaskId;
};

export const getSelectedTaskId = () => {
  const store = getStore();
  return store.selectedTaskId;
};

export const getLatestMerchantTask = async () => {
  const store = getStore();
  const tasks = await listMerchantTasks().catch(() => []);

  if (store.selectedTaskId) {
    const selectedTask = tasks.find((task) => task.id === store.selectedTaskId);

    if (selectedTask) {
      store.latestMerchantTask = selectedTask;
      return selectedTask;
    }
  }

  const latestTask = tasks.at(-1) || store.latestMerchantTask;

  if (latestTask?.id) {
    store.latestMerchantTask = latestTask;
    store.selectedTaskId = latestTask.id;
  }

  return latestTask || null;
};

export const getMerchantTaskDetail = async (taskId) => {
  const task = await request({
    url: `${getApiBaseUrl()}/merchant/tasks/${taskId}`,
    method: "GET",
    header: merchantHeader()
  });
  const store = getStore();
  const meta = store.taskMetaById[task.id] || {};

  const detail = {
    id: task.id,
    merchantId: task.merchantId,
    title: meta.title || getTaskTitle(task.id),
    status: task.status,
    rewardText:
      meta.rewardText ||
      (task.rewardTags.length ? task.rewardTags.join("/") : "基础奖+排名奖"),
    budgetSummary:
      meta.budgetSummary ||
      {
        baseAmount: 0,
        baseCount: 0,
        rankingTotal: task.escrowLockedAmount,
        lockedTotal: task.escrowLockedAmount
      },
    escrowLockedAmount: task.escrowLockedAmount,
    submissionCount: task.submissionCount,
    rewardTags: task.rewardTags
  };

  store.taskMetaById[task.id] = {
    ...meta,
    ...detail
  };

  return detail;
};

export const getCreatorTaskDetail = async (taskId) => {
  const task = await request({
    url: `${getApiBaseUrl()}/creator/tasks/${taskId}`,
    method: "GET",
    header: creatorHeader()
  });
  const store = getStore();
  const meta = store.taskMetaById[task.id] || {};
  const detail = mergeCreatorTaskDetail(task, meta);

  store.taskMetaById[task.id] = {
    ...meta,
    ...detail
  };

  return detail;
};

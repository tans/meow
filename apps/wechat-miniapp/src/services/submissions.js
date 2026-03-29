import { request } from "./http.js";
import { getStore } from "./store.js";

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

const ensureSubmissionBucket = (taskId) => {
  const store = getStore();
  store.submissionsByTaskId[taskId] = store.submissionsByTaskId[taskId] || [];
  return store.submissionsByTaskId[taskId];
};

export const createCreatorSubmission = async (taskId, input) => {
  const response = await request({
    url: `${getApiBaseUrl()}/creator/tasks/${taskId}/submissions`,
    method: "POST",
    data: input,
    header: creatorHeader()
  });

  const store = getStore();
  const bucket = ensureSubmissionBucket(taskId);
  const submission = {
    id: response.id,
    taskId: response.taskId,
    creatorId: response.creatorId,
    assetUrl: response.assetUrl,
    description: response.description,
    status: response.status,
    rewardTag: "待审核"
  };

  bucket.unshift(submission);

  return submission;
};

export const listTaskSubmissions = async (taskId) => {
  const items = await request({
    url: `${getApiBaseUrl()}/merchant/tasks/${taskId}/submissions`,
    method: "GET",
    header: merchantHeader()
  });

  const bucket = ensureSubmissionBucket(taskId);
  bucket.splice(0, bucket.length, ...items.map((item) => ({
    id: item.id,
    taskId: item.taskId,
    creatorId: item.creatorId,
    status: item.status,
    rewardTag:
      item.rewardTags.length > 0
        ? item.rewardTags.join("/")
        : "待审核"
  })));

  return bucket;
};

export const listCreatorSubmissions = async () => {
  const items = await request({
    url: `${getApiBaseUrl()}/creator/submissions`,
    method: "GET",
    header: creatorHeader()
  });

  return items.map((item) => ({
    id: item.id,
    taskId: item.taskId,
    creatorId: item.creatorId,
    assetUrl: item.assetUrl,
    description: item.description,
    status: item.status,
    rewardTag:
      item.rewardTags.length > 0
        ? item.rewardTags.join("/")
        : "待审核"
  }));
};

export const listCreatorTaskSubmissions = async (taskId) => {
  const items = await request({
    url: `${getApiBaseUrl()}/creator/tasks/${taskId}/submissions`,
    method: "GET",
    header: creatorHeader()
  });

  return items.map((item) => ({
    id: item.id,
    taskId: item.taskId,
    creatorId: item.creatorId,
    assetUrl: item.assetUrl,
    description: item.description,
    status: item.status,
    rewardTag:
      item.rewardTags.length > 0
        ? item.rewardTags.join("/")
        : "待审核"
  }));
};

export const getCreatorTaskSubmission = async (taskId, submissionId) => {
  const submissions = await listCreatorTaskSubmissions(taskId);
  return submissions.find((item) => item.id === submissionId) || null;
};

export const updateCreatorSubmission = async (submissionId, input) => {
  return await request({
    url: `${getApiBaseUrl()}/creator/submissions/${submissionId}`,
    method: "PATCH",
    data: input,
    header: creatorHeader()
  });
};

export const withdrawCreatorSubmission = async (submissionId) => {
  return await request({
    url: `${getApiBaseUrl()}/creator/submissions/${submissionId}/withdraw`,
    method: "POST",
    header: creatorHeader()
  });
};

export const reviewTaskSubmission = async (taskId, submissionId, decision = "approved") => {
  const response = await request({
    url: `${getApiBaseUrl()}/merchant/submissions/${submissionId}/review`,
    method: "POST",
    data: { decision },
    header: merchantHeader()
  });

  const store = getStore();
  const bucket = ensureSubmissionBucket(taskId);
  const index = bucket.findIndex((item) => item.id === submissionId);

  if (index >= 0) {
    bucket[index] = {
      ...bucket[index],
      status: response.status,
      rewardTag:
        response.status === "approved"
          ? "基础奖已冻结"
          : "已驳回"
    };
  }

  return response;
};

export const tipTaskSubmission = async (taskId, submissionId) => {
  const response = await request({
    url: `${getApiBaseUrl()}/merchant/submissions/${submissionId}/tips`,
    method: "POST",
    header: merchantHeader()
  });

  const store = getStore();
  const bucket = ensureSubmissionBucket(taskId);
  const index = bucket.findIndex((item) => item.id === submissionId);

  if (index >= 0) {
    bucket[index] = {
      ...bucket[index],
      rewardTag: "基础奖/打赏已冻结"
    };
  }

  return response;
};

export const addRankingReward = async (taskId, submissionId) => {
  const response = await request({
    url: `${getApiBaseUrl()}/merchant/tasks/${taskId}/rewards/ranking`,
    method: "POST",
    data: { submissionId },
    header: merchantHeader()
  });

  const store = getStore();
  const bucket = ensureSubmissionBucket(taskId);
  const index = bucket.findIndex((item) => item.id === submissionId);

  if (index >= 0) {
    bucket[index] = {
      ...bucket[index],
      rewardTag: "基础奖/排名奖已冻结"
    };
  }

  return response;
};

export const settleMerchantTask = async (taskId) => {
  return await request({
    url: `${getApiBaseUrl()}/merchant/tasks/${taskId}/settle`,
    method: "POST",
    header: merchantHeader()
  });
};

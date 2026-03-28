import { request } from "./http.js";
import { getStore } from "./store.js";

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
  store.wallet.creator.weeklyAdded += 1;

  return submission;
};

export const listTaskSubmissions = (taskId) => {
  const bucket = ensureSubmissionBucket(taskId);
  return bucket;
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

  if (response.status === "approved") {
    store.wallet.creator.frozen += 1;
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

  store.wallet.creator.frozen += response.amount;
  store.wallet.merchant.tipSpend += response.amount;

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

  store.wallet.creator.frozen += response.amount;
  store.wallet.merchant.refundPending = Math.max(
    store.wallet.merchant.refundPending - response.amount,
    0
  );

  return response;
};

export const settleMerchantTask = async (taskId) => {
  const response = await request({
    url: `${getApiBaseUrl()}/merchant/tasks/${taskId}/settle`,
    method: "POST",
    header: merchantHeader()
  });

  const store = getStore();
  store.wallet.creator.available += response.creatorAvailableDelta;
  store.wallet.creator.frozen = Math.max(
    store.wallet.creator.frozen - response.creatorAvailableDelta,
    0
  );
  store.wallet.merchant.escrow = Math.max(
    store.wallet.merchant.escrow - response.creatorAvailableDelta - response.merchantRefundDelta,
    0
  );
  store.wallet.merchant.refundPending = 0;

  return response;
};

import type {
  CreateRankingRewardResponse,
  CreateTipResponse,
  ReviewSubmissionResponse
} from "@meow/contracts";
import { demoFinanceConfig } from "@meow/domain-finance";
import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import { freezeTipReward } from "./ledger.js";

const getMerchantOwnedTask = (merchantId: string, taskId: string) => {
  const task = db.getTask(taskId);

  if (!task) {
    throw new AppError(404, "task not found");
  }

  if (task.merchantId !== merchantId) {
    throw new AppError(403, "merchant does not own task");
  }

  return task;
};

const getMerchantOwnedSubmission = (merchantId: string, submissionId: string) => {
  const submission = db.getSubmission(submissionId);

  if (!submission) {
    throw new AppError(404, "submission not found");
  }

  const task = getMerchantOwnedTask(merchantId, submission.taskId);

  return { submission, task };
};

export const reviewSubmission = (
  merchantId: string,
  submissionId: string,
  decision: "approved" | "rejected"
): ReviewSubmissionResponse => {
  const { submission } = getMerchantOwnedSubmission(merchantId, submissionId);

  const nextStatus = decision === "approved" ? "approved" : "rejected";
  db.saveSubmission({
    ...submission,
    status: nextStatus,
    reviewReason:
      decision === "rejected" ? submission.reviewReason ?? "merchant_rejected" : undefined
  });

  if (decision === "rejected") {
    const baseReward = db.findRewardBySubmissionAndType(submissionId, "base");

    if (baseReward) {
      db.saveReward({
        ...baseReward,
        status: "cancelled"
      });
    }

    return {
      submissionId,
      status: "rejected",
      rewardType: baseReward ? "base" : undefined,
      rewardStatus: baseReward ? "cancelled" : undefined
    };
  }

  const existingBaseReward = db.findRewardBySubmissionAndType(submissionId, "base");
  const baseReward =
    existingBaseReward ??
    db.createReward({
      taskId: submission.taskId,
      submissionId: submission.id,
      creatorId: submission.creatorId,
      type: "base",
      amount: demoFinanceConfig.baseRewardAmount,
      status: "frozen"
    });

  return {
    submissionId,
    status: "approved",
    rewardType: "base",
    rewardStatus: "frozen"
  };
};

export const createTipReward = (
  merchantId: string,
  submissionId: string
): CreateTipResponse => {
  const { submission } = getMerchantOwnedSubmission(merchantId, submissionId);
  const reward = db.createReward({
    taskId: submission.taskId,
    submissionId: submission.id,
    creatorId: submission.creatorId,
    type: "tip",
    amount: demoFinanceConfig.tipRewardAmount,
    status: "frozen"
  });

  db.appendLedgerEntries(
    freezeTipReward(submission.taskId, submission.id, reward.amount)
  );

  return {
    submissionId,
    taskId: submission.taskId,
    rewardType: "tip",
    rewardStatus: "frozen",
    amount: reward.amount
  };
};

export const createRankingReward = (
  merchantId: string,
  taskId: string,
  submissionId?: string
): CreateRankingRewardResponse => {
  getMerchantOwnedTask(merchantId, taskId);

  const rankedSubmission =
    (submissionId ? db.getSubmission(submissionId) : undefined) ??
    db
      .listSubmissionsByTask(taskId)
      .find((submission) => submission.status === "approved");

  if (!rankedSubmission || rankedSubmission.taskId !== taskId) {
    throw new AppError(404, "approved submission not found");
  }

  if (rankedSubmission.status !== "approved") {
    throw new AppError(403, "submission is not approved");
  }

  const existingRankingReward = db.findRewardBySubmissionAndType(
    rankedSubmission.id,
    "ranking"
  );
  const reward =
    existingRankingReward ??
    db.createReward({
      taskId,
      submissionId: rankedSubmission.id,
      creatorId: rankedSubmission.creatorId,
      type: "ranking",
      amount: demoFinanceConfig.rankingRewardAmount,
      status: "frozen"
    });

  return {
    submissionId: rankedSubmission.id,
    taskId,
    rewardType: "ranking",
    rewardStatus: "frozen",
    amount: reward.amount
  };
};

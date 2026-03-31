import type {
  CreateMerchantTaskDraftInput,
  MerchantTaskDetail,
  MerchantTaskListItem,
  PublishTaskResponse
} from "@meow/contracts";
import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import { lockMerchantEscrow } from "./ledger.js";

export interface CreateTaskDraftResponse {
  taskId: string;
  status: "draft";
}

export const createTaskDraft = (
  merchantUserId: string,
  input: CreateMerchantTaskDraftInput
): CreateTaskDraftResponse => {
  const task = db.createTaskDraft(merchantUserId, input);

  return {
    taskId: task.id,
    status: "draft"
  };
};

export const publishTask = (
  merchantUserId: string,
  taskId: string
): PublishTaskResponse => {
  const task = db.getTask(taskId);

  if (!task) {
    throw new AppError(404, "task not found");
  }

  if (task.merchantId !== merchantUserId) {
    throw new AppError(403, "merchant does not own task");
  }

  const ledgerResult = lockMerchantEscrow(taskId);

  db.saveTask({
    ...task,
    status: "published",
    escrowLockedAmount: ledgerResult.lockedAmount
  });
  db.appendLedgerEntries(ledgerResult.entries);

  return {
    id: taskId,
    merchantId: merchantUserId,
    status: "published",
    ledgerEffect: ledgerResult.ledgerEffect
  };
};

export const listMerchantTasks = (
  merchantUserId: string
): MerchantTaskListItem[] =>
  db
    .listTasks()
    .filter((task) => task.merchantId === merchantUserId)
    .map((task) => ({
      id: task.id,
      merchantId: task.merchantId,
      title: task.title,
      status: task.status,
      escrowLockedAmount: task.escrowLockedAmount,
      submissionCount: db.listSubmissionsByTask(task.id).length,
      assetAttachments: task.assetAttachments
    }));

export const getMerchantTaskDetail = (
  merchantUserId: string,
  taskId: string
): MerchantTaskDetail => {
  const task = db.getTask(taskId);

  if (!task) {
    throw new AppError(404, "task not found");
  }

  if (task.merchantId !== merchantUserId) {
    throw new AppError(403, "merchant does not own task");
  }

  const rewardTags = [
    ...new Set(db.listRewardsByTask(taskId).map((reward) => reward.type))
  ];

  return {
    id: task.id,
    merchantId: task.merchantId,
    title: task.title,
    status: task.status,
    escrowLockedAmount: task.escrowLockedAmount,
    submissionCount: db.listSubmissionsByTask(task.id).length,
    rewardTags,
    assetAttachments: task.assetAttachments
  };
};

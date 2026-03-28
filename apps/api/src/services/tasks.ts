import type { PublishTaskResponse } from "@meow/contracts";
import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";
import { lockMerchantEscrow } from "./ledger.js";

export interface CreateTaskDraftResponse {
  taskId: string;
  status: "draft";
}

export const createTaskDraft = (merchantId: string): CreateTaskDraftResponse => {
  const task = db.createTaskDraft(merchantId);

  return {
    taskId: task.id,
    status: "draft"
  };
};

export const publishTask = (
  taskId: string,
  merchantId: string
): PublishTaskResponse => {
  const task = db.getTask(taskId);

  if (!task) {
    throw new AppError(404, "task not found");
  }

  if (task.merchantId !== merchantId) {
    throw new AppError(403, "merchant does not own task");
  }

  const ledgerResult = lockMerchantEscrow();

  db.saveTask({
    ...task,
    status: "published"
  });

  return {
    status: "published",
    ledgerEffect: ledgerResult.ledgerEffect
  };
};

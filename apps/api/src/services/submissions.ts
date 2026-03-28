import type {
  CreateSubmissionInput,
  CreateSubmissionResponse,
  CreatorTaskFeedItem
} from "@meow/contracts";
import { db } from "../lib/db.js";
import { AppError } from "../lib/errors.js";

let nextSubmissionId = 1;

export const listPublicTasks = (): CreatorTaskFeedItem[] =>
  db
    .listTasks()
    .filter((task) => task.status === "published")
    .map((task) => ({
      id: task.id,
      merchantId: task.merchantId,
      status: "published"
    }));

export const createSubmission = (
  creatorId: string,
  taskId: string,
  input: CreateSubmissionInput
): CreateSubmissionResponse => {
  const task = db.getTask(taskId);

  if (!task) {
    throw new AppError(404, "task not found");
  }

  if (task.status !== "published") {
    throw new AppError(403, "task is not published");
  }

  const submission = db.saveSubmission({
    id: `submission-${nextSubmissionId++}`,
    taskId,
    creatorId,
    assetUrl: input.assetUrl,
    description: input.description,
    status: "submitted"
  });

  return {
    id: submission.id,
    taskId: submission.taskId,
    creatorId: submission.creatorId,
    assetUrl: submission.assetUrl,
    description: submission.description,
    status: "submitted"
  };
};

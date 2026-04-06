import type {
  CreateSubmissionInput,
  CreateSubmissionResponse,
  CreatorSubmissionItem,
  CreatorTaskDetail,
  CreatorTaskFeedItem,
  SubmissionReadModelItem,
  UpdateSubmissionResponse,
  WithdrawSubmissionResponse
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
      status: "published",
      title: task.title,
      rewardAmount: task.escrowLockedAmount,
    }));

export const getCreatorTaskDetail = (
  creatorUserId: string,
  taskId: string
): CreatorTaskDetail => {
  const task = db.getTask(taskId);

  if (!task) {
    throw new AppError(404, "task not found");
  }

  if (task.status === "draft") {
    throw new AppError(403, "task is not available");
  }

  return {
    id: task.id,
    merchantId: task.merchantId,
    status: task.status,
    creatorSubmissionCount: db
      .listSubmissionsByTask(taskId)
      .filter((submission) => submission.creatorId === creatorUserId).length
  };
};

export const createSubmission = (
  creatorUserId: string,
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
    creatorId: creatorUserId,
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

const getCreatorOwnedSubmission = (creatorUserId: string, submissionId: string) => {
  const submission = db.getSubmission(submissionId);

  if (!submission) {
    throw new AppError(404, "submission not found");
  }

  if (submission.creatorId !== creatorUserId) {
    throw new AppError(403, "creator does not own submission");
  }

  return submission;
};

const mapSubmissionReadModel = (
  submission: ReturnType<typeof db.getSubmission> extends infer T
    ? Exclude<T, undefined>
    : never
): SubmissionReadModelItem => {
  const rewardTags = [
    ...new Set(
      db.listRewardsBySubmission(submission.id).map((reward) => reward.type)
    )
  ];

  return {
    id: submission.id,
    taskId: submission.taskId,
    creatorId: submission.creatorId,
    status: submission.status,
    rewardTags
  };
};

const mapCreatorSubmissionItem = (
  submission: ReturnType<typeof db.getSubmission> extends infer T
    ? Exclude<T, undefined>
    : never
): CreatorSubmissionItem => ({
  ...mapSubmissionReadModel(submission),
  assetUrl: submission.assetUrl,
  description: submission.description
});

export const listMerchantTaskSubmissions = (
  merchantUserId: string,
  taskId: string
): SubmissionReadModelItem[] => {
  const task = db.getTask(taskId);

  if (!task) {
    throw new AppError(404, "task not found");
  }

  if (task.merchantId !== merchantUserId) {
    throw new AppError(403, "merchant does not own task");
  }

  return db.listSubmissionsByTask(taskId).map(mapSubmissionReadModel);
};

export const listCreatorSubmissions = (
  creatorUserId: string
): CreatorSubmissionItem[] =>
  db.listSubmissionsByCreator(creatorUserId).map(mapCreatorSubmissionItem);

export const listCreatorTaskSubmissions = (
  creatorUserId: string,
  taskId: string
): CreatorSubmissionItem[] => {
  const task = db.getTask(taskId);

  if (!task) {
    throw new AppError(404, "task not found");
  }

  if (task.status === "draft") {
    throw new AppError(403, "task is not available");
  }

  return db
    .listSubmissionsByTask(taskId)
    .filter((submission) => submission.creatorId === creatorUserId)
    .map(mapCreatorSubmissionItem);
};

export const updateSubmission = (
  creatorUserId: string,
  submissionId: string,
  input: CreateSubmissionInput
): UpdateSubmissionResponse => {
  const submission = getCreatorOwnedSubmission(creatorUserId, submissionId);

  if (submission.status !== "submitted") {
    throw new AppError(403, "submission is not editable");
  }

  const updated = db.saveSubmission({
    ...submission,
    assetUrl: input.assetUrl,
    description: input.description
  });

  return {
    id: updated.id,
    taskId: updated.taskId,
    creatorId: updated.creatorId,
    assetUrl: updated.assetUrl,
    description: updated.description,
    status: "submitted"
  };
};

export const withdrawSubmission = (
  creatorUserId: string,
  submissionId: string
): WithdrawSubmissionResponse => {
  const submission = getCreatorOwnedSubmission(creatorUserId, submissionId);

  if (submission.status !== "submitted") {
    throw new AppError(403, "submission cannot be withdrawn");
  }

  db.saveSubmission({
    ...submission,
    status: "withdrawn"
  });

  return {
    submissionId,
    status: "withdrawn"
  };
};

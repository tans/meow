import type {
  AuthSessionPayload,
  CreateRankingRewardResponse,
  CreateTipResponse,
  CreatorSubmissionItem,
  CreatorTaskDetail,
  CreatorTaskFeedItem,
  CreatorWalletSnapshot,
  CreateSubmissionInput,
  CreateSubmissionResponse,
  LoginResponse,
  MerchantTaskDetail,
  MerchantTaskListItem,
  PublishTaskResponse,
  ReviewSubmissionResponse,
  SettleTaskResponse,
  SubmissionReadModelItem,
  UpdateSubmissionResponse,
  WithdrawSubmissionResponse
} from "@meow/contracts";
import type { WebRole } from "./session.js";

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

export const login = async (input: {
  identifier: string;
  secret: string;
  client: "web";
}): Promise<LoginResponse> =>
  parseJson<LoginResponse>(
    await fetch("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const getSession = async (): Promise<AuthSessionPayload | null> => {
  const response = await fetch("/auth/session");

  if (response.status === 401) {
    return null;
  }

  return parseJson<AuthSessionPayload>(response);
};

export const switchRole = async (role: WebRole): Promise<AuthSessionPayload> =>
  parseJson<AuthSessionPayload>(
    await fetch("/auth/switch-role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role })
    })
  );

export const listCreatorTasks = async (): Promise<CreatorTaskFeedItem[]> =>
  parseJson<CreatorTaskFeedItem[]>(await fetch("/creator/tasks"));

export const getCreatorTaskDetail = async (
  taskId: string
): Promise<CreatorTaskDetail> =>
  parseJson<CreatorTaskDetail>(await fetch(`/creator/tasks/${taskId}`));

export const listCreatorTaskSubmissions = async (
  taskId: string
): Promise<CreatorSubmissionItem[]> =>
  parseJson<CreatorSubmissionItem[]>(
    await fetch(`/creator/tasks/${taskId}/submissions`)
  );

export const listCreatorSubmissions = async (): Promise<CreatorSubmissionItem[]> =>
  parseJson<CreatorSubmissionItem[]>(await fetch("/creator/submissions"));

export const createCreatorSubmission = async (
  taskId: string,
  input: CreateSubmissionInput
): Promise<CreateSubmissionResponse> =>
  parseJson<CreateSubmissionResponse>(
    await fetch(`/creator/tasks/${taskId}/submissions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const updateCreatorSubmission = async (
  submissionId: string,
  input: CreateSubmissionInput
): Promise<UpdateSubmissionResponse> =>
  parseJson<UpdateSubmissionResponse>(
    await fetch(`/creator/submissions/${submissionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const withdrawCreatorSubmission = async (
  submissionId: string
): Promise<WithdrawSubmissionResponse> =>
  parseJson<WithdrawSubmissionResponse>(
    await fetch(`/creator/submissions/${submissionId}/withdraw`, {
      method: "POST"
    })
  );

export const getCreatorWallet = async (): Promise<CreatorWalletSnapshot> =>
  parseJson<CreatorWalletSnapshot>(await fetch("/creator/wallet"));

export const listMerchantTasks = async (): Promise<MerchantTaskListItem[]> =>
  parseJson<MerchantTaskListItem[]>(await fetch("/merchant/tasks"));

export const createMerchantTaskDraft = async (): Promise<{
  taskId: string;
  status: "draft";
}> =>
  parseJson<{ taskId: string; status: "draft" }>(
    await fetch("/merchant/tasks", { method: "POST" })
  );

export const publishMerchantTask = async (
  taskId: string
): Promise<PublishTaskResponse> =>
  parseJson<PublishTaskResponse>(
    await fetch(`/merchant/tasks/${taskId}/publish`, { method: "POST" })
  );

export const getMerchantTaskDetail = async (
  taskId: string
): Promise<MerchantTaskDetail> =>
  parseJson<MerchantTaskDetail>(await fetch(`/merchant/tasks/${taskId}`));

export const listMerchantTaskSubmissions = async (
  taskId: string
): Promise<SubmissionReadModelItem[]> =>
  parseJson<SubmissionReadModelItem[]>(
    await fetch(`/merchant/tasks/${taskId}/submissions`)
  );

export const reviewMerchantSubmission = async (
  submissionId: string,
  decision: "approved" | "rejected" = "approved"
): Promise<ReviewSubmissionResponse> =>
  parseJson<ReviewSubmissionResponse>(
    await fetch(`/merchant/submissions/${submissionId}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision })
    })
  );

export const tipMerchantSubmission = async (
  submissionId: string
): Promise<CreateTipResponse> =>
  parseJson<CreateTipResponse>(
    await fetch(`/merchant/submissions/${submissionId}/tips`, { method: "POST" })
  );

export const addMerchantRankingReward = async (
  taskId: string,
  submissionId: string
): Promise<CreateRankingRewardResponse> =>
  parseJson<CreateRankingRewardResponse>(
    await fetch(`/merchant/tasks/${taskId}/rewards/ranking`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ submissionId })
    })
  );

export const settleMerchantTask = async (
  taskId: string
): Promise<SettleTaskResponse> =>
  parseJson<SettleTaskResponse>(
    await fetch(`/merchant/tasks/${taskId}/settle`, { method: "POST" })
  );

import type {
  AuthSessionPayload,
  CreateMerchantTaskDraftInput,
  CreateRankingRewardResponse,
  CreateTipResponse,
  CreatorSubmissionItem,
  CreatorTaskDetail,
  CreatorTaskFeedItem,
  CreatorWalletSnapshot,
  CreateSubmissionInput,
  CreateSubmissionResponse,
  LoginResponse,
  MerchantTaskAttachment,
  MerchantTaskDetail,
  MerchantTaskListItem,
  PublishTaskResponse,
  ReviewSubmissionResponse,
  SettleTaskResponse,
  SubmissionReadModelItem,
  UploadMerchantTaskAssetsResponse,
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

const apiFetch = (path: string, init?: RequestInit) => fetch(`/api${path}`, init);

export const login = async (input: {
  identifier: string;
  secret: string;
  client: "web";
}): Promise<LoginResponse> =>
  parseJson<LoginResponse>(
    await apiFetch("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const getSession = async (): Promise<AuthSessionPayload | null> => {
  const response = await apiFetch("/auth/session");

  if (response.status === 401) {
    return null;
  }

  return parseJson<AuthSessionPayload>(response);
};

export const switchRole = async (role: WebRole): Promise<AuthSessionPayload> =>
  parseJson<AuthSessionPayload>(
    await apiFetch("/auth/switch-role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role })
    })
  );

export const listCreatorTasks = async (): Promise<CreatorTaskFeedItem[]> =>
  parseJson<CreatorTaskFeedItem[]>(await apiFetch("/creator/tasks"));

export const getCreatorTaskDetail = async (
  taskId: string
): Promise<CreatorTaskDetail> =>
  parseJson<CreatorTaskDetail>(await apiFetch(`/creator/tasks/${taskId}`));

export const listCreatorTaskSubmissions = async (
  taskId: string
): Promise<CreatorSubmissionItem[]> =>
  parseJson<CreatorSubmissionItem[]>(
    await apiFetch(`/creator/tasks/${taskId}/submissions`)
  );

export const listCreatorSubmissions = async (): Promise<CreatorSubmissionItem[]> =>
  parseJson<CreatorSubmissionItem[]>(await apiFetch("/creator/submissions"));

export const createCreatorSubmission = async (
  taskId: string,
  input: CreateSubmissionInput
): Promise<CreateSubmissionResponse> =>
  parseJson<CreateSubmissionResponse>(
    await apiFetch(`/creator/tasks/${taskId}/submissions`, {
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
    await apiFetch(`/creator/submissions/${submissionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const withdrawCreatorSubmission = async (
  submissionId: string
): Promise<WithdrawSubmissionResponse> =>
  parseJson<WithdrawSubmissionResponse>(
    await apiFetch(`/creator/submissions/${submissionId}/withdraw`, {
      method: "POST"
    })
  );

export const getCreatorWallet = async (): Promise<CreatorWalletSnapshot> =>
  parseJson<CreatorWalletSnapshot>(await apiFetch("/creator/wallet"));

export const listMerchantTasks = async (): Promise<MerchantTaskListItem[]> =>
  parseJson<MerchantTaskListItem[]>(await apiFetch("/merchant/tasks"));

export const uploadMerchantTaskAssets = async (
  files: File[]
): Promise<MerchantTaskAttachment[]> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await parseJson<UploadMerchantTaskAssetsResponse>(
    await apiFetch("/merchant/uploads", {
      method: "POST",
      body: formData
    })
  );

  return response.attachments;
};

export const createMerchantTaskDraft = async (
  input: CreateMerchantTaskDraftInput
): Promise<{
  taskId: string;
  status: "draft";
}> =>
  parseJson<{ taskId: string; status: "draft" }>(
    await apiFetch("/merchant/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export const publishMerchantTask = async (
  taskId: string
): Promise<PublishTaskResponse> =>
  parseJson<PublishTaskResponse>(
    await apiFetch(`/merchant/tasks/${taskId}/publish`, { method: "POST" })
  );

export const getMerchantTaskDetail = async (
  taskId: string
): Promise<MerchantTaskDetail> =>
  parseJson<MerchantTaskDetail>(await apiFetch(`/merchant/tasks/${taskId}`));

export const listMerchantTaskSubmissions = async (
  taskId: string
): Promise<SubmissionReadModelItem[]> =>
  parseJson<SubmissionReadModelItem[]>(
    await apiFetch(`/merchant/tasks/${taskId}/submissions`)
  );

export const reviewMerchantSubmission = async (
  submissionId: string,
  decision: "approved" | "rejected" = "approved"
): Promise<ReviewSubmissionResponse> =>
  parseJson<ReviewSubmissionResponse>(
    await apiFetch(`/merchant/submissions/${submissionId}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision })
    })
  );

export const tipMerchantSubmission = async (
  submissionId: string
): Promise<CreateTipResponse> =>
  parseJson<CreateTipResponse>(
    await apiFetch(`/merchant/submissions/${submissionId}/tips`, { method: "POST" })
  );

export const addMerchantRankingReward = async (
  taskId: string,
  submissionId: string
): Promise<CreateRankingRewardResponse> =>
  parseJson<CreateRankingRewardResponse>(
    await apiFetch(`/merchant/tasks/${taskId}/rewards/ranking`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ submissionId })
    })
  );

export const settleMerchantTask = async (
  taskId: string
): Promise<SettleTaskResponse> =>
  parseJson<SettleTaskResponse>(
    await apiFetch(`/merchant/tasks/${taskId}/settle`, { method: "POST" })
  );

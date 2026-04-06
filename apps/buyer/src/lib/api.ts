import type {
  AuthSessionPayload,
  CreateMerchantTaskDraftInput,
  CreateRankingRewardResponse,
  CreateTipResponse,
  LoginResponse,
  MerchantTaskAttachment,
  MerchantTaskDetail,
  MerchantTaskListItem,
  MerchantWalletSnapshot,
  PublishTaskResponse,
  ReviewSubmissionResponse,
  SettleTaskResponse,
  SubmissionReadModelItem,
} from "@meow/contracts";

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }
  return (await response.json()) as T;
};

const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`/api${path}`, init);

export const loginMerchant = async (input: {
  identifier: string;
  secret: string;
}): Promise<LoginResponse> =>
  parseJson<LoginResponse>(
    await apiFetch("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, client: "web" }),
    })
  );

export const getMerchantSession =
  async (): Promise<AuthSessionPayload | null> => {
    const response = await apiFetch("/auth/session");
    if (response.status === 401) return null;
    return parseJson<AuthSessionPayload>(response);
  };

export const listMerchantTasks =
  async (): Promise<MerchantTaskListItem[]> =>
    parseJson<MerchantTaskListItem[]>(await apiFetch("/merchant/tasks"));

export const getMerchantTaskDetail = async (
  taskId: string
): Promise<MerchantTaskDetail> =>
  parseJson<MerchantTaskDetail>(await apiFetch(`/merchant/tasks/${taskId}`));

export const createMerchantTaskDraft = async (
  input: CreateMerchantTaskDraftInput
): Promise<{ taskId: string; status: "draft" }> =>
  parseJson<{ taskId: string; status: "draft" }>(
    await apiFetch("/merchant/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    })
  );

export const publishMerchantTask = async (
  taskId: string
): Promise<PublishTaskResponse> =>
  parseJson<PublishTaskResponse>(
    await apiFetch(`/merchant/tasks/${taskId}/publish`, { method: "POST" })
  );

export const uploadMerchantTaskAssets = async (
  files: File[]
): Promise<MerchantTaskAttachment[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const response = await parseJson<{ attachments: MerchantTaskAttachment[] }>(
    await apiFetch("/merchant/uploads", { method: "POST", body: formData })
  );
  return response.attachments;
};

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
      body: JSON.stringify({ decision }),
    })
  );

export const tipMerchantSubmission = async (
  submissionId: string
): Promise<CreateTipResponse> =>
  parseJson<CreateTipResponse>(
    await apiFetch(`/merchant/submissions/${submissionId}/tips`, {
      method: "POST",
    })
  );

export const addMerchantRankingReward = async (
  taskId: string,
  submissionId: string
): Promise<CreateRankingRewardResponse> =>
  parseJson<CreateRankingRewardResponse>(
    await apiFetch(`/merchant/tasks/${taskId}/rewards/ranking`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ submissionId }),
    })
  );

export const settleMerchantTask = async (
  taskId: string
): Promise<SettleTaskResponse> =>
  parseJson<SettleTaskResponse>(
    await apiFetch(`/merchant/tasks/${taskId}/settle`, { method: "POST" })
  );

export const getMerchantWalletSnapshot = async (): Promise<MerchantWalletSnapshot> =>
  parseJson<MerchantWalletSnapshot>(await apiFetch("/merchant/wallet"));

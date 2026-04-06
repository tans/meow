import type { BoundedContext, Surface } from "@meow/domain-core";

export interface RouteContract {
  id: string;
  surface: Surface;
  path: string;
  context: BoundedContext;
  permissions: string[];
  purpose: string;
}

export type AppRole = "creator" | "merchant" | "operator";
export type AppClient = "web" | "miniapp" | "admin";

export interface AuthUserSummary {
  id: string;
  displayName: string;
}

export interface AuthSessionPayload {
  sessionId: string;
  userId: string;
  activeRole: AppRole;
  roles: AppRole[];
}

export interface LoginRequest {
  identifier: string;
  secret: string;
  client: AppClient;
}

export interface LoginResponse extends AuthSessionPayload {
  user: AuthUserSummary;
}

export interface SwitchRoleRequest {
  role: AppRole;
}

export interface PublishTaskResponse {
  id: string;
  merchantId: string;
  status: "published";
  ledgerEffect: "merchant_escrow_locked";
}

export interface MerchantTaskAttachment {
  id: string;
  kind: "image" | "video";
  url: string;
  fileName: string;
  mimeType: string;
}

export interface CreateMerchantTaskDraftInput {
  title: string;
  baseAmount?: number;
  baseCount?: number;
  rankingTotal?: number;
  assetAttachments: MerchantTaskAttachment[];
}

export interface CreateMerchantTaskDraftResponse {
  taskId: string;
  status: "draft";
}

export interface UploadMerchantTaskAssetsResponse {
  attachments: MerchantTaskAttachment[];
}

export interface CreatorTaskFeedItem {
  id: string;
  merchantId: string;
  status: "published";
  title: string;
  rewardAmount: number;
}

export interface CreatorTaskDetail {
  id: string;
  merchantId: string;
  status: "published" | "paused" | "ended" | "settled" | "closed";
  creatorSubmissionCount: number;
}

export interface CreateSubmissionInput {
  assetUrl: string;
  description: string;
}

export interface CreateSubmissionResponse extends CreateSubmissionInput {
  id: string;
  taskId: string;
  creatorId: string;
  status: "submitted";
}

export interface UpdateSubmissionResponse extends CreateSubmissionInput {
  id: string;
  taskId: string;
  creatorId: string;
  status: "submitted";
}

export interface WithdrawSubmissionResponse {
  submissionId: string;
  status: "withdrawn";
}

export interface MerchantTaskListItem {
  id: string;
  merchantId: string;
  title: string;
  status: "draft" | "published" | "paused" | "ended" | "settled" | "closed";
  escrowLockedAmount: number;
  submissionCount: number;
  assetAttachments: MerchantTaskAttachment[];
}

export interface MerchantTaskDetail extends MerchantTaskListItem {
  rewardTags: Array<"base" | "ranking" | "tip">;
}

export interface SubmissionReadModelItem {
  id: string;
  taskId: string;
  creatorId: string;
  status: "submitted" | "approved" | "rejected" | "withdrawn";
  rewardTags: Array<"base" | "ranking" | "tip">;
}

export interface CreatorSubmissionItem extends SubmissionReadModelItem {
  assetUrl: string;
  description: string;
}

export interface CreatorWalletSnapshot {
  creatorId: string;
  frozenAmount: number;
  availableAmount: number;
  submissionCount: number;
}

export interface MerchantWalletSnapshot {
  merchantId: string;
  escrowAmount: number;
  refundableAmount: number;
  tipSpentAmount: number;
  publishedTaskCount: number;
}

export interface ReviewSubmissionResponse {
  submissionId: string;
  status: "approved" | "rejected";
  rewardType?: "base";
  rewardStatus?: "frozen" | "cancelled";
}

export interface CreateTipResponse {
  submissionId: string;
  taskId: string;
  rewardType: "tip";
  rewardStatus: "frozen";
  amount: number;
}

export interface CreateRankingRewardResponse {
  submissionId: string;
  taskId: string;
  rewardType: "ranking";
  rewardStatus: "frozen";
  amount: number;
}

export interface SettleTaskResponse {
  taskId: string;
  status: "settled";
  creatorAvailableDelta: number;
  merchantRefundDelta: number;
}

export const routeContracts: RouteContract[] = [
  {
    id: "merchant-task-create",
    surface: "app",
    path: "/merchant/tasks",
    context: "task",
    permissions: ["merchant:task:create", "merchant:wallet:use"],
    purpose: "商家创建并发布任务"
  },
  {
    id: "merchant-submission-review",
    surface: "app",
    path: "/merchant/tasks/:taskId/submissions",
    context: "submission",
    permissions: ["merchant:submission:review"],
    purpose: "商家审核投稿、评分和打赏"
  },
  {
    id: "creator-task-feed",
    surface: "app",
    path: "/creator/tasks",
    context: "task",
    permissions: ["creator:task:view"],
    purpose: "创作者浏览、筛选和报名任务"
  },
  {
    id: "creator-submission-create",
    surface: "app",
    path: "/creator/tasks/:taskId/submissions",
    context: "submission",
    permissions: ["creator:submission:create"],
    purpose: "创作者向公开任务提交作品"
  },
  {
    id: "creator-wallet",
    surface: "app",
    path: "/creator/wallet",
    context: "wallet",
    permissions: ["creator:wallet:view", "creator:wallet:withdraw"],
    purpose: "创作者查看收益与发起提现"
  },
  {
    id: "admin-risk-center",
    surface: "admin",
    path: "/risk-center",
    context: "risk",
    permissions: ["admin:risk:review"],
    purpose: "风控审核、违规处理和申诉入口"
  },
  {
    id: "admin-finance-center",
    surface: "admin",
    path: "/finance-center",
    context: "wallet",
    permissions: ["admin:finance:manage"],
    purpose: "资金总览、提现处理与对账"
  },
  {
    id: "admin-system-settings",
    surface: "admin",
    path: "/system/settings",
    context: "system",
    permissions: ["admin:system:manage"],
    purpose: "系统参数、权限与日志管理"
  }
];

export const surfaceIds = ["web", "wechat-miniapp", "admin", "api"] as const;

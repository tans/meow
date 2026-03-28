import type { BoundedContext, Surface } from "@meow/domain-core";

export interface RouteContract {
  id: string;
  surface: Surface;
  path: string;
  context: BoundedContext;
  permissions: string[];
  purpose: string;
}

export interface PublishTaskResponse {
  id: string;
  merchantId: string;
  status: "published";
  ledgerEffect: "merchant_escrow_locked";
}

export interface CreatorTaskFeedItem {
  id: string;
  merchantId: string;
  status: "published";
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

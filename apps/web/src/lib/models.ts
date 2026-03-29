import type { CreatorTaskFeedItem, MerchantTaskListItem } from "@meow/contracts";

export interface CreatorTaskCardModel {
  id: string;
  title: string;
  brandName: string;
  budgetText: string;
  deadlineText: string;
}

export interface MerchantTaskCardModel {
  id: string;
  title: string;
  submissionCount: number;
  statusText: string;
}

const taskStatusText: Record<MerchantTaskListItem["status"], string> = {
  draft: "草稿中",
  published: "征集中",
  paused: "已暂停",
  ended: "已截止",
  settled: "已结算",
  closed: "已关闭"
};

const taskTitleById: Record<string, string> = {
  "task-1": "春季穿搭口播征稿"
};

const merchantLabelById: Record<string, string> = {
  "merchant-1": "Demo Merchant"
};

const resolveTaskTitle = (taskId: string): string =>
  taskTitleById[taskId] ?? `创意任务 ${taskId}`;

const resolveMerchantLabel = (merchantId: string): string =>
  merchantLabelById[merchantId] ?? merchantId;

export const mapCreatorTasks = (
  tasks: CreatorTaskFeedItem[]
): CreatorTaskCardModel[] =>
  tasks.map((task) => ({
    id: task.id,
    title: resolveTaskTitle(task.id),
    brandName: resolveMerchantLabel(task.merchantId),
    budgetText: task.status === "published" ? "预算托管中" : "预算待确认",
    deadlineText: "开放征集中"
  }));

export const mapMerchantTasks = (
  tasks: MerchantTaskListItem[]
): MerchantTaskCardModel[] =>
  tasks.map((task) => ({
    id: task.id,
    title: resolveTaskTitle(task.id),
    submissionCount: task.submissionCount,
    statusText: taskStatusText[task.status]
  }));

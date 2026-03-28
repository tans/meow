export interface TaskLifecycleStage {
  id: string;
  label: string;
  owner: "merchant" | "platform" | "creator";
  checkpoints: string[];
}

export interface SubmissionGuardrail {
  id: string;
  description: string;
  appliesTo: Array<"merchant" | "creator" | "platform">;
}

export const taskLifecycle: TaskLifecycleStage[] = [
  {
    id: "draft",
    label: "任务草稿",
    owner: "merchant",
    checkpoints: ["任务要求完整", "奖励规则完整", "素材可用"]
  },
  {
    id: "funded",
    label: "预算已托管",
    owner: "merchant",
    checkpoints: ["预算覆盖基础奖和排名奖", "余额扣款成功"]
  },
  {
    id: "published",
    label: "任务已发布",
    owner: "platform",
    checkpoints: ["任务内容合规", "可见范围生效", "投稿截止时间明确"]
  },
  {
    id: "reviewing",
    label: "投稿审核中",
    owner: "merchant",
    checkpoints: ["通过/驳回都有理由", "支持批量操作", "违规内容走风控"]
  },
  {
    id: "settled",
    label: "任务已结算",
    owner: "platform",
    checkpoints: ["基础奖与排名奖发放完成", "未使用赏金退回", "统计归档完成"]
  }
];

export const submissionGuardrails: SubmissionGuardrail[] = [
  {
    id: "merchant-configurable-limit",
    description: "单个任务允许商家自定义最大投稿数，默认 3-5 条区间。",
    appliesTo: ["merchant", "creator"]
  },
  {
    id: "duplicate-check",
    description: "任务可启用 AI 查重，用于拦截重复投稿或相似作品。",
    appliesTo: ["merchant", "platform"]
  },
  {
    id: "review-mutation-window",
    description: "审核通过前允许修改或删除投稿，审核通过后删除不影响已获得基础奖。",
    appliesTo: ["creator", "platform"]
  }
];


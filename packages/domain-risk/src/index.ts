export interface RiskRule {
  id: string;
  signal: string;
  action: string;
  impactsCredit: boolean;
}

export const riskRules: RiskRule[] = [
  {
    id: "duplicate-content",
    signal: "AI 查重超过阈值",
    action: "进入人工复核或自动拦截",
    impactsCredit: true
  },
  {
    id: "spam-submission",
    signal: "短时间内大量无关投稿",
    action: "限制投稿权限并记录违规",
    impactsCredit: true
  },
  {
    id: "malicious-rejection",
    signal: "商家存在恶意驳回或拖延发奖",
    action: "触发申诉仲裁与信用扣分",
    impactsCredit: true
  },
  {
    id: "abnormal-withdrawal",
    signal: "提现金额或频次异常",
    action: "冻结提现并转人工审核",
    impactsCredit: false
  }
];

export const appealDecisionTypes = [
  "reject",
  "support",
  "partial-support"
] as const;


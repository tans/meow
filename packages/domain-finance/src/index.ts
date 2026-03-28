export interface MoneyRule {
  id: string;
  label: string;
  details: string[];
}

export const rewardTypes = ["base", "ranking", "tip"] as const;

export type RewardType = (typeof rewardTypes)[number];

export const rewardStatuses = ["frozen", "available", "cancelled"] as const;

export type RewardStatus = (typeof rewardStatuses)[number];

export const ledgerAccounts = [
  "merchant_balance",
  "merchant_escrow",
  "creator_frozen",
  "creator_available"
] as const;

export type LedgerAccount = (typeof ledgerAccounts)[number];

export const demoFinanceConfig = {
  publishEscrowLockedAmount: 3,
  baseRewardAmount: 1,
  rankingRewardAmount: 1,
  tipRewardAmount: 1
} as const;

export const escrowRules: MoneyRule[] = [
  {
    id: "prepaid-full-budget",
    label: "发布前全额预付",
    details: ["任务上线前必须锁定基础奖与排名奖预算", "总预算由平台实时计算"]
  },
  {
    id: "frozen-earning",
    label: "收益冻结与解冻",
    details: ["创作者奖励在任务结束前保持冻结", "任务结束后自动转为可提现余额"]
  },
  {
    id: "unused-budget-return",
    label: "未使用赏金退回",
    details: ["已发放基础奖励不退", "未发放预算原路退回商家账户"]
  }
];

export const financeConsoleResponsibilities = [
  "商家充值、退款、余额和账单核对",
  "创作者收益、冻结资金和提现处理",
  "按任务类型与奖励类型配置平台抽成",
  "每日和每月生成对账报表"
] as const;

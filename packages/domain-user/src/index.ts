import type { AppModule } from "@meow/domain-core";

export interface CreditRule {
  minScore: number;
  maxSubmissionsPerDay: number;
  canSubmit: boolean;
}

export interface UserDomainBlueprint {
  merchantCapabilities: string[];
  creatorCapabilities: string[];
  sharedCapabilities: string[];
  creditRules: CreditRule[];
}

export const userDomainBlueprint: UserDomainBlueprint = {
  merchantCapabilities: [
    "轻量化入驻与后置认证",
    "个人中心、余额与账单管理",
    "商家信用、消息通知与收款账户绑定"
  ],
  creatorCapabilities: [
    "手机号/微信登录与实名绑定",
    "收益、提现与隐私设置",
    "创作者信用、违规原因与申诉入口"
  ],
  sharedCapabilities: [
    "统一账户会话与消息中心",
    "信用规则驱动的行为门控",
    "身份信息变更审计"
  ],
  creditRules: [
    { minScore: 80, maxSubmissionsPerDay: Number.POSITIVE_INFINITY, canSubmit: true },
    { minScore: 60, maxSubmissionsPerDay: 10, canSubmit: true },
    { minScore: 40, maxSubmissionsPerDay: 5, canSubmit: true },
    { minScore: 0, maxSubmissionsPerDay: 0, canSubmit: false }
  ]
};

export const appUserModules: AppModule[] = [
  {
    id: "merchant-center",
    name: "Merchant Center",
    surface: "app",
    owner: ["merchant", "wallet", "notification"],
    personas: ["merchant"],
    milestone: "mvp",
    responsibilities: ["商家入驻", "账户与信用管理", "余额、账单和消息入口"]
  },
  {
    id: "creator-center",
    name: "Creator Center",
    surface: "app",
    owner: ["creator", "wallet", "notification"],
    personas: ["creator"],
    milestone: "mvp",
    responsibilities: ["注册实名", "收益与提现", "信用和违规入口"]
  }
];


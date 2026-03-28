export type Surface = "app" | "admin" | "harness";

export type Persona =
  | "merchant"
  | "creator"
  | "operator"
  | "risk-analyst"
  | "finance-operator";

export type BoundedContext =
  | "identity"
  | "merchant"
  | "creator"
  | "task"
  | "submission"
  | "wallet"
  | "settlement"
  | "risk"
  | "appeal"
  | "notification"
  | "analytics"
  | "system";

export type ProductMilestone = "foundation" | "mvp" | "beta" | "ga";

export interface AppModule {
  id: string;
  name: string;
  surface: Surface;
  owner: BoundedContext[];
  personas: Persona[];
  milestone: ProductMilestone;
  responsibilities: string[];
}

export interface FlowStep {
  id: string;
  label: string;
  context: BoundedContext;
  surface: Surface;
  guards?: string[];
  outcome: string;
}

export interface ProductFlow {
  id: string;
  name: string;
  personas: Persona[];
  criticality: "high" | "medium";
  steps: FlowStep[];
}

export interface WorkspaceManifest {
  apps: AppModule[];
  packages: Array<{
    name: string;
    contexts: BoundedContext[];
    responsibilities: string[];
  }>;
  coreFlows: ProductFlow[];
}

export interface HarnessScenario {
  id: string;
  title: string;
  personas: Persona[];
  dependsOnContexts: BoundedContext[];
  requiredFlows: string[];
  assertions: string[];
  routeIds?: string[];
  replaySteps?: string[];
}

export interface HarnessReplayResult {
  scenarioId: string;
  steps: string[];
  ok: boolean;
}

export const workspaceManifest: WorkspaceManifest = {
  apps: [
    {
      id: "app-shell",
      name: "User App Shell",
      surface: "app",
      owner: ["merchant", "creator", "notification"],
      personas: ["merchant", "creator"],
      milestone: "foundation",
      responsibilities: [
        "承载商家端与创作者端的导航和会话上下文",
        "共享消息中心、信用中心与钱包入口",
        "为移动 App 与小程序保留统一业务编排层"
      ]
    },
    {
      id: "admin-shell",
      name: "Admin Console",
      surface: "admin",
      owner: ["system", "risk", "wallet", "analytics"],
      personas: ["operator", "risk-analyst", "finance-operator"],
      milestone: "foundation",
      responsibilities: [
        "平台官方后台路由、权限分区与工作台入口",
        "覆盖任务审核、资金处理、申诉仲裁与系统设置",
        "承接后续风控监控和数据看板"
      ]
    },
    {
      id: "harness-shell",
      name: "Scenario Harness",
      surface: "harness",
      owner: ["system", "analytics"],
      personas: ["operator"],
      milestone: "foundation",
      responsibilities: [
        "校验关键业务闭环是否被 workspace 覆盖",
        "为 vibe coding 产物提供最小回归门禁",
        "沉淀关键场景的断言与约束"
      ]
    }
  ],
  packages: [
    {
      name: "@meow/domain-core",
      contexts: ["system", "analytics"],
      responsibilities: ["定义 workspace manifest、流程和 harness 类型"]
    },
    {
      name: "@meow/domain-user",
      contexts: ["identity", "merchant", "creator", "notification"],
      responsibilities: ["入驻注册、账号中心、信用、消息与身份策略"]
    },
    {
      name: "@meow/domain-task",
      contexts: ["task", "submission"],
      responsibilities: ["任务创建、任务审核、投稿管理、效果回看"]
    },
    {
      name: "@meow/domain-finance",
      contexts: ["wallet", "settlement"],
      responsibilities: ["余额、充值、托管、自动结算与退款"]
    },
    {
      name: "@meow/domain-risk",
      contexts: ["risk", "appeal"],
      responsibilities: ["AI 风控、违规处理、申诉仲裁、信用联动"]
    },
    {
      name: "@meow/contracts",
      contexts: ["system", "merchant", "creator", "task", "wallet", "risk"],
      responsibilities: ["三端页面入口、操作权限、API 契约映射"]
    }
  ],
  coreFlows: [
    {
      id: "merchant-task-lifecycle",
      name: "商家任务全生命周期",
      personas: ["merchant"],
      criticality: "high",
      steps: [
        {
          id: "merchant-onboarding",
          label: "商家入驻与账户初始化",
          context: "merchant",
          surface: "app",
          outcome: "形成可发布任务的基础账户"
        },
        {
          id: "prepaid-budget-lock",
          label: "充值并托管任务预算",
          context: "wallet",
          surface: "app",
          guards: ["预算必须覆盖基础奖和排名奖"],
          outcome: "任务上线前完成预算锁定"
        },
        {
          id: "task-publish",
          label: "创建并发布任务",
          context: "task",
          surface: "app",
          guards: ["任务配置与投稿限制完整"],
          outcome: "任务进入可投稿状态"
        },
        {
          id: "submission-review",
          label: "审核投稿并评选获奖",
          context: "submission",
          surface: "app",
          guards: ["通过风控与违规检测"],
          outcome: "基础奖励与排名奖励状态明确"
        },
        {
          id: "task-settlement",
          label: "任务结束后自动结算与退款",
          context: "settlement",
          surface: "app",
          guards: ["已发奖励冻结后解冻", "未使用赏金退回"],
          outcome: "账务与任务状态收敛"
        }
      ]
    },
    {
      id: "creator-earning-lifecycle",
      name: "创作者投稿变现链路",
      personas: ["creator"],
      criticality: "high",
      steps: [
        {
          id: "creator-onboarding",
          label: "注册实名与提现绑定",
          context: "creator",
          surface: "app",
          outcome: "形成可投稿可提现账户"
        },
        {
          id: "task-discovery",
          label: "浏览与报名任务",
          context: "task",
          surface: "app",
          guards: ["信用分满足投稿限制"],
          outcome: "创作者进入任务参与态"
        },
        {
          id: "work-submission",
          label: "上传作品并等待审核",
          context: "submission",
          surface: "app",
          guards: ["单任务投稿次数受限", "支持修改删除待审稿件"],
          outcome: "作品进入审核队列"
        },
        {
          id: "earning-unfreeze",
          label: "任务结束后收益解冻",
          context: "settlement",
          surface: "app",
          outcome: "收益从冻结转为可提现"
        },
        {
          id: "withdrawal",
          label: "发起提现",
          context: "wallet",
          surface: "app",
          guards: ["提现合规校验通过"],
          outcome: "进入 T+1 到账流程"
        }
      ]
    },
    {
      id: "platform-risk-loop",
      name: "平台风控与仲裁闭环",
      personas: ["operator", "risk-analyst", "finance-operator"],
      criticality: "high",
      steps: [
        {
          id: "risk-detect",
          label: "识别违规投稿或异常资金",
          context: "risk",
          surface: "admin",
          outcome: "生成待处理异常事件"
        },
        {
          id: "appeal-handle",
          label: "审核申诉并作出裁决",
          context: "appeal",
          surface: "admin",
          outcome: "裁决结果写回双方状态"
        },
        {
          id: "credit-adjust",
          label: "同步信用和权限处理",
          context: "risk",
          surface: "admin",
          outcome: "违规方被扣分或限权"
        },
        {
          id: "funds-reconcile",
          label: "联动结算与对账",
          context: "wallet",
          surface: "admin",
          outcome: "资金账与裁决结果一致"
        }
      ]
    }
  ]
};

import type { HarnessScenario } from "@meow/domain-core";

export interface ScenarioDefinition extends HarnessScenario {
  description: string;
}

export const scenarios: ScenarioDefinition[] = [
  {
    id: "merchant-publish-submit-settle",
    title: "商家发布任务后创作者投稿并结算",
    description: "验证 publish -> submit -> approve -> settle 这条主链。",
    personas: ["merchant", "creator"],
    dependsOnContexts: ["merchant", "creator", "task", "submission", "wallet", "settlement"],
    requiredFlows: ["merchant-task-lifecycle", "creator-earning-lifecycle"],
    routeIds: ["merchant-task-create", "merchant-submission-review", "creator-task-feed"],
    assertions: [
      "任务发布前完成基础奖和排名奖预算托管",
      "创作者投稿进入待审核状态",
      "任务结算后收益从冻结转可提现"
    ],
    replaySteps: ["publish", "submit", "approve", "settle"]
  },
  {
    id: "merchant-funded-task",
    title: "商家完成托管后发布任务并走向结算",
    description: "覆盖商家从轻量入驻、充值托管、发布任务、审核投稿到任务结束退款的完整主链路。",
    personas: ["merchant"],
    dependsOnContexts: ["merchant", "wallet", "task", "submission", "settlement"],
    requiredFlows: ["merchant-task-lifecycle"],
    routeIds: ["merchant-task-create", "merchant-submission-review"],
    assertions: [
      "任务上线前必须完成预算托管",
      "审核动作必须保留通过/驳回理由",
      "任务结束时未使用赏金原路退回"
    ]
  },
  {
    id: "creator-earning-loop",
    title: "创作者投稿通过后收益解冻并提现",
    description: "覆盖创作者注册、任务浏览、投稿、收益解冻和提现路径。",
    personas: ["creator"],
    dependsOnContexts: ["creator", "task", "submission", "settlement", "wallet"],
    requiredFlows: ["creator-earning-lifecycle"],
    routeIds: ["creator-task-feed", "creator-wallet"],
    assertions: [
      "信用分规则决定每日投稿上限",
      "审核通过前允许修改或删除投稿",
      "任务结束后冻结收益才能进入提现流程"
    ]
  },
  {
    id: "appeal-reconciles-risk-and-funds",
    title: "申诉裁决同步影响信用和账务",
    description: "覆盖平台处理恶意投稿、恶意驳回、异常提现等争议时的联动动作。",
    personas: ["operator", "risk-analyst", "finance-operator"],
    dependsOnContexts: ["risk", "appeal", "wallet", "notification"],
    requiredFlows: ["platform-risk-loop"],
    routeIds: ["admin-risk-center", "admin-finance-center"],
    assertions: [
      "申诉必须保留证据与裁决理由",
      "裁决结果必须回写信用状态或权限状态",
      "涉及资金的裁决必须进入对账",
      "涉及冻结收益或退款的裁决必须同步账务状态"
    ]
  },
  {
    id: "admin-keeps-system-governed",
    title: "后台运营可以统一管理规则、权限与日志",
    description: "覆盖系统参数、权限管理和审计日志，确保后续生成代码不绕过后台治理层。",
    personas: ["operator"],
    dependsOnContexts: ["system", "analytics", "risk"],
    requiredFlows: ["platform-risk-loop"],
    routeIds: ["admin-system-settings", "admin-risk-center"],
    assertions: [
      "系统参数变更必须进入日志审计",
      "后台权限需要按角色切分",
      "异常提醒要能够关联到待处理事件",
      "风控事件处理必须保留裁决依据或信用联动记录"
    ]
  }
];

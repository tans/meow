# Harness 设计

## 目的

`harness` 不是普通 demo，也不是空壳测试目录。它的任务是把功能文档中的关键业务闭环转成可持续校验的场景定义，给 vibe coding 过程提供稳定护栏。

## 当前校验内容

- 场景依赖的 bounded context 是否都已在 workspace 中声明。
- 场景绑定的核心流程是否存在。
- 场景映射的路由契约是否存在。
- 涉及资金的场景是否包含托管、冻结、退款或提现断言。
- 涉及风控/申诉的场景是否包含证据、裁决或信用联动断言。
- 需要 workflow replay 的场景是否输出了预期步骤。
- 所有核心流程是否都有至少一个 harness 场景覆盖。

## 当前场景

- `merchant-publish-submit-settle`
  商家发布任务、创作者投稿、商家审核并完成结算的 MVP 主交易链回放。
- `merchant-funded-task`
  商家从预算托管到任务结算。
- `creator-earning-loop`
  创作者从报名投稿到收益解冻提现。
- `appeal-reconciles-risk-and-funds`
  平台处理申诉并同步信用和账务。
- `admin-keeps-system-governed`
  后台管理系统参数、权限和日志。

## 运行方式

```bash
pnpm install
pnpm smoke
pnpm harness
```

`pnpm harness` 报告里如果出现 `workflow-replayed`，代表该场景不仅完成静态绑定检查，还完成了预设步骤回放。

当前回放步骤：

- `merchant-publish-submit-settle` -> `publish -> submit -> approve -> settle`

## 扩展规则

- 新增业务闭环前，先补 `apps/harness/src/scenarios.ts`。
- 新增页面或接口时，同时补 `packages/contracts`。
- 新增领域包时，必须把上下文写入 `workspaceManifest`。
- 后续接入真实 API 后，优先在 `apps/harness` 增加“契约校验 -> mock 回放 -> 真实环境 smoke”三层执行模式。

# Meow Monorepo

`meow` 是一个面向中小企业与创作者的 AI 内容众包撮合平台 monorepo。当前仓库基于功能文档完成了基础工程骨架、领域拆分、交付规划和 `harness` 场景回归入口，方便后续按模块逐步落地。

## Workspace

- `apps/app`: 用户端聚合壳，承载商家端与创作者端的共享业务能力。
- `apps/admin`: 平台官方后台壳，面向运营、风控、资金和内容管理。
- `apps/harness`: 面向 vibe coding 流程的业务场景验证入口，保证关键闭环不被后续生成代码破坏。
- `packages/domain-core`: 领域模型、workspace manifest 与核心流程定义。
- `packages/domain-*`: 按用户、任务、资金、风控拆分的 bounded context。
- `packages/contracts`: 三端契约、页面入口、权限面与流程映射。
- `docs`: 架构说明、迭代规划和 harness 约束说明。

部署说明见 [docs/deployment.md](/Users/ke/code/meow/docs/deployment.md)。

## Quick Start

```bash
pnpm install
pnpm typecheck
pnpm harness
```

`pnpm harness` 现在同时做两类校验：

- 静态校验：contexts、flows、route contracts、资金/风控断言是否覆盖
- 流程回放：对关键主链场景输出 `publish -> submit -> approve -> settle` 这类回放结果

## Local Start

```bash
pnpm --filter @meow/api dev
pnpm --filter @meow/web dev
pnpm --filter @meow/admin dev
pnpm --filter @meow/wechat-miniapp dev
```

微信小程序使用原生工程目录 `apps/wechat-miniapp/miniprogram`，通过微信开发者工具打开，不走跨端框架。

### 单端口 Entry 服务（默认 26401）

如果你不想依赖 Nginx/Caddy 这类外部反向代理，可以直接启动仓库内置的 `entry` 服务：

```bash
pnpm entry
```

它会串联启动 3 个子服务并在一个端口暴露统一入口：

- `/web/*` -> `@meow/web`
- `/api/*` -> `@meow/api`（会去掉 `/api` 前缀再转发）
- `/admin/*` -> `@meow/admin`

默认端口与可选覆盖：

- `ENTRY_PORT`（默认 `26401`）
- `API_PORT`（默认 `26411`）
- `WEB_PORT`（默认 `26412`）
- `ADMIN_PORT`（默认 `26413`）


`apps/web` 与 `apps/wechat-miniapp` 共用同一套 `/auth/*`、`/creator/*`、`/merchant/*` 接口；
`apps/admin` 使用 `/admin/*` 接口，登录账号必须具备 `operator` 角色。

## Smoke Check

- [ ] API health works
- [ ] Merchant can publish a task
- [ ] Creator can submit to a task
- [ ] Merchant can settle a task
- [ ] Admin can pause a task

推荐直接运行：

```bash
pnpm smoke
```

## Product Scope

功能文档覆盖三条主线：

- 商家端：入驻、充值、发布任务、审核投稿、评奖和效果复盘。
- 创作者端：注册、浏览任务、投稿、收益解冻与提现。
- 平台后台：任务审核、资金托管、申诉仲裁、风控和系统运营。

## Harness First

这个仓库把 `harness` 作为一等公民处理。原因很直接：在 vibe coding 迭代里，单次生成的页面或接口很容易偏离业务闭环，而内容众包平台的核心风险点正好集中在跨模块流程上：

- 任务发布必须绑定资金托管。
- 投稿审核必须经过信用与风控检查。
- 任务结束必须走自动结算与未用完赏金退回。
- 申诉裁决必须同时影响用户信用与账务状态。

因此，后续每次引入新页面、接口或自动化生成代码，都应先补充对应 `harness` 场景，再扩展实现。

当前已接入的首条 workflow replay 场景是 `merchant-publish-submit-settle`，用于验证商家发布任务、创作者投稿、商家审核和任务结算这条 MVP 主交易链。

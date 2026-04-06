# Meow Monorepo

`meow` 是一个面向中小企业与创作者的 AI 内容众包撮合平台 monorepo。当前仓库基于功能文档完成了基础工程骨架、领域拆分、交付规划和 `harness` 场景回归入口，方便后续按模块逐步落地。

## Workspace

- `apps/www`: 落地页，首页根路径 `/`。
- `apps/square`: 用户端，路径 `/square/`。
- `apps/admin`: 平台官方后台壳，面向运营、风控、资金和内容管理，路径 `/admin/`。
- `apps/api`: 后端接口，PM2 管理，监听端口 26411。
- `apps/entry`: 统一入口代理，可选替代 Nginx。
- `apps/app`: 用户端聚合壳，承载商家端与创作者端的共享业务能力。
- `apps/harness`: 面向 vibe coding 流程的业务场景验证入口，保证关键闭环不被后续生成代码破坏。
- `packages/domain-core`: 领域模型、workspace manifest 与核心流程定义。
- `packages/domain-*`: 按用户、任务、资金、风控拆分的 bounded context。
- `packages/contracts`: 三端契约、页面入口、权限面与流程映射。
- `docs`: 架构说明、迭代规划和 harness 约束说明。

部署说明见 [docs/deployment.md](/Users/ke/code/meow/docs/deployment.md)。

## 部署

### 快速部署

```bash
# 完整部署 (构建 + 修复路径 + 上传 + 验证)
./deploy-meow.sh all

# 跳过构建，仅部署已有产物
./deploy-meow.sh deploy --skip-build

# 仅验证部署状态
./deploy-meow.sh verify
```

### 部署流程

完整流程 `all` 命令包含以下步骤：

1. **检查依赖** - 验证 pnpm、scp、SSH key 是否可用
2. **构建项目** - 依次构建 contracts、square、admin、www、api、entry
3. **修复路径** - 将 `index.html` 中的绝对路径 `/assets/` 改为相对路径 `./assets/`
4. **部署静态文件** - www → `/`、square → `/square/`、admin → `/admin/`，通过 tar + scp 上传，自动备份旧版本
5. **部署 API** - 上传到 `/data/meow-api`，通过 PM2 管理，监听端口 26411
6. **配置 Nginx** - 通过 OpenResty Docker 容器重载配置
7. **验证** - 检查 `/`、`/square/`、`/admin/`、`/api/health`
8. **清理** - 删除 3 天前的备份

### 服务器配置

| 配置项 | 值 |
|--------|-----|
| 远程地址 | `139.224.105.241` |
| SSH 私钥 | `./ssh/139.224.105.241_20260404233402_id_rsa` |
| 静态文件路径 | `/opt/1panel/apps/openresty/openresty/www/sites/meow.ali.minapp.xin` |
| API 路径 | `/data/meow-api` |
| OpenResty 容器 | `3cbbfa1dd0c0` |
| 访问地址 | `https://meow.ali.minapp.xin` |

### 路径映射

| URL | 来源 | 说明 |
|-----|------|------|
| `/` | `apps/www/dist` | 落地页 |
| `/square/` | `apps/square/dist` | 用户端 |
| `/admin/` | `apps/admin/dist` | 管理后台 |
| `/api/*` | API 服务 (端口 26411) | 后端接口，rewrite 去掉前缀 |

### 命令

| 命令 | 说明 |
|------|------|
| `./deploy-meow.sh all` | 完整部署流程 |
| `./deploy-meow.sh build` | 仅构建项目 |
| `./deploy-meow.sh deploy` | 仅上传静态文件和 API |
| `./deploy-meow.sh api` | 仅部署 API |
| `./deploy-meow.sh verify` | 验证部署 |
| `./deploy-meow.sh clean` | 清理旧备份 |

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SSH_KEY` | `./ssh/139.224.105.241_20260404233402_id_rsa` | SSH 私钥路径 |

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
pnpm --filter @meow/www dev      # 落地页 (端口见 vite.config)
pnpm --filter @meow/square dev   # 用户端
pnpm --filter @meow/admin dev    # 管理后台
pnpm --filter @meow/api dev      # 后端 API
```

微信小程序使用原生工程目录 `apps/wechat-miniapp/miniprogram`，通过微信开发者工具打开，不走跨端框架。

### 单端口 Entry 服务（默认 26401）

如果你不想依赖 Nginx/Caddy 这类外部反向代理，可以直接启动仓库内置的 `entry` 服务：

```bash
pnpm entry
```

它会串联启动 3 个子服务并在一个端口暴露统一入口：

- `/web/*` -> `@meow/square`
- `/api/*` -> `@meow/api`（会去掉 `/api` 前缀再转发）
- `/admin/*` -> `@meow/admin`

### 端口分配

| 服务 | 环境变量 | 默认端口 |
|------|---------|---------|
| Entry（统一入口） | `ENTRY_PORT` | 26401 |
| API | `API_PORT` | 26411 |
| Web | `WEB_PORT` | 26412 |
| Admin | `ADMIN_PORT` | 26413 |


`apps/square` 与 `apps/wechat-miniapp` 共用同一套 `/auth/*`、`/creator/*`、`/merchant/*` 接口；
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

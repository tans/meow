# 创意喵（Meow）

任务发布与接单平台，支持**任务发布者（商家/买家）**与**任务接单者（创作者）**两个用户角色。包含 Web 用户端、商家管理端、运营后台三端。

---

## 项目结构

```
meow/
├── apps/
│   ├── api/          # REST API 后端（Hono + SQLite）
│   ├── entry/        # 开发入口进程：统一路由 + 子服务管理
│   ├── square/       # Web 用户端（创作者 + 商家双角色）
│   ├── buyer/        # 商家端（任务发布者独立工作台）
│   ├── admin/        # 运营后台
│   ├── www/          # 落地页
│   ├── app/          # （预留）
│   ├── wechat-miniapp/  # 微信小程序
│   └── harness/      # 测试工具
│
├── packages/
│   ├── contracts/    # 前后端共用 TypeScript 类型定义
│   ├── database/     # SQLite 数据库封装与 Schema
│   ├── domain-core/  # 核心领域模型
│   ├── domain-finance/  # 财务领域
│   ├── domain-risk/    # 风控领域
│   ├── domain-task/    # 任务领域
│   ├── domain-user/    # 用户领域
│   └── storage/      # 文件存储（OSS/S3）
│
├── deploy-meow.sh    # 生产部署脚本（meow.ali.minapp.xin）
├── deploy.sh         # 生产部署脚本（miao.ali.minapp.xin）
└── pnpm-workspace.yaml
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 样式 | Tailwind CSS + shadcn/ui 组件 |
| 构建 | Vite |
| 后端 | Hono（Node.js）|
| 数据库 | SQLite |
| 包管理 | pnpm + Turbo |
| CI/CD | PM2（生产）|

---

## 服务端口

| 服务 | 环境变量 | 本地端口 | 生产端口 |
|------|---------|---------|---------|
| Entry（统一入口） | `ENTRY_PORT` | 26401 | — |
| API | `API_PORT` | 26411 | — |
| Square（Web） | `SQUARE_PORT` | 26412 | — |
| Admin（运营） | `ADMIN_PORT` | 26413 | — |
| Buyer（商家） | `BUYER_PORT` | 26414 | — |

---

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动完整开发环境（entry 接管所有子服务）
pnpm run entry

# 独立启动单个服务
pnpm --filter @meow/square dev   # Web 用户端 (:26412)
pnpm --filter @meow/buyer dev    # 商家端 (:26414)
pnpm --filter @meow/admin dev   # 运营后台 (:26413)
pnpm --filter @meow/api dev     # 后端 API (:26411)
```

> `pnpm run dev` 不推荐使用，会同时启动 entry + api 导致 SQLite 文件锁冲突。  
> 使用 `pnpm run entry` 即可一次性启动所有服务。

---

## 构建

```bash
# 构建所有包和应用
pnpm run build

# 构建单个应用
pnpm --filter @meow/square build
pnpm --filter @meow/buyer build
pnpm --filter @meow/admin build
```

---

## 测试

```bash
pnpm test                    # 运行所有测试
pnpm --filter @meow/square test  # 只跑 square
pnpm --filter @meow/buyer test   # 只跑 buyer
```

---

## 生产部署

```bash
# 完整部署（构建 + 上传 + 验证）
./deploy-meow.sh all

# 仅部署（跳过构建）
./deploy-meow.sh deploy --skip-build

# 仅验证
./deploy-meow.sh verify
```

访问地址：

- Landing: https://meow.ali.minapp.xin/
- Square: https://meow.ali.minapp.xin/square/
- Buyer: https://meow.ali.minapp.xin/buyer/
- Admin: https://meow.ali.minapp.xin/admin/
- API: https://meow.ali.minapp.xin/api/

---

## 用户角色

| 角色 | 说明 | 入口 |
|------|------|------|
| **创作者（Creator）** | 接任务、提交作品、查看收益 | Square |
| **商家（Merchant）** | 发布任务、管理投稿、结算收益 | Square（角色切换）或 Buyer（独立工作台）|
| **运营（Admin）** | 平台运营、数据监控、风控管理 | Admin |

---

## 数据库

- 开发环境默认使用本地 `meow.sqlite`（由 `apps/api` 管理）
- 生产环境数据文件路径：`/data/meow/shared/data/meow.sqlite`
- 数据库 Schema 定义在 `packages/database`

---

## 注意事项

- `apps/web/` 已废弃，内容已迁移至 `apps/square/`，请勿直接修改
- 生产部署 API 端会通过 PM2 管理，与 Web 静态文件分开部署
- `packages/contracts` 为前后端共用类型定义，所有 API 响应类型应在此定义

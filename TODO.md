# Meow 技术栈迁移 — Bun + daisyUI + jQuery

> 目标：用 `Bun` + `bun:sqlite` + `daisyUI` + `jQuery` 替代 React + Vite + Hono + Drizzle

---

## ✅ Phase 0 — 清理旧 React/TS 文件（已完成）

- [x] 0.1 删除 `apps/www/src/`、`vite.config.ts`、`postcss.config.js`、`components.json`
- [x] 0.2 删除 `apps/square/src/`、`vite.config.ts`、`tailwind.config.js`、`models.test.ts`、`session.test.ts`
- [x] 0.3 删除 `apps/admin/src/`、`vite.config.ts`、`postcss.config.js`、`components.json`
- [x] 0.4 删除 `apps/buyer/src/`、`vite.config.ts`、`postcss.config.js`、`components.json`
- [x] 0.5 删除所有 `packages/*/src/`（TypeScript 源码已迁移到 JS）
- [x] 0.6 删除 `apps/api/src/`、`vite.config.ts`、`dist/`
- [x] 0.7 删除 `turbo.json`、`pnpm-workspace.yaml`（不再需要）
- [x] 0.8 删除废弃项目：`apps/app`、`apps/harness`、`apps/web`

---

## ✅ Phase 1 — packages/database（已完成）

- [x] 1.1 `packages/database/schema.js` — 枚举常量 + JSDoc 类型定义
- [x] 1.2 `packages/database/db.js` — Bun SQLite 连接 + Schema 初始化
- [x] 1.3 `packages/database/seed.js` — Demo 用户 + Demo 任务
- [x] 1.4 `packages/database/repository.js` — 完整数据仓储（21 个方法）
- [x] 1.5 `packages/database/package.json` — 更新依赖（type: module）
- [x] 1.6 清理旧 ts 文件（dist、tsconfig.json）

---

## ✅ Phase 2 — domain packages（已完成）

- [x] 2.1 `packages/contracts/index.js` — API 契约类型（JSDoc）
- [x] 2.2 `packages/domain-core/index.js` — 路由契约、Surface、BoundedContext
- [x] 2.3 `packages/domain-finance/index.js` — 账务常量、奖励类型、账户类型
- [x] 2.4 `packages/domain-task/index.js` — 任务状态机、边界检查、事件
- [x] 2.5 `packages/domain-user/index.js` — 角色、权限、Credit 规则
- [x] 2.6 `packages/domain-risk/index.js` — 风控规则、用户状态
- [x] 2.7 `packages/storage/index.js` — 简化存储键生成

---

## ✅ Phase 3 — API 服务（已完成）

### 3.1 `apps/api/server.js` — Bun HTTP API 服务（P0 阻塞）

**完整路由清单（参考 apps/api/src/ 原有实现）：**

```
Public:
  GET  /health                    — 健康检查 + SQLite 连通性
  GET  /version                   — { buildTime, packageVersion }
  GET  /stats                     — { publishedTasks, submissions, creators }

Auth:
  POST /auth/login                — body: { identifier, secret, client } → cookie: meow_session
  GET  /auth/session              — cookie → { user, session }
  POST /auth/switch-role          — body: { role } → 更新 session activeRole

Creator (创作者):
  GET  /creator/tasks             — 公开任务列表（status=published）
  GET  /creator/tasks/:id         — 任务详情（含 creatorSubmissionCount）
  GET  /creator/wallet            — 钱包快照 { creatorId, frozenAmount, availableAmount, submissionCount }
  POST /creator/tasks/:id/submissions — body: { assetUrl, description }
  GET  /creator/submissions       — 我的投稿（含分页）
  PATCH /creator/submissions/:id  — body: { assetUrl?, description? }
  POST /creator/submissions/:id/withdraw — 撤回

Merchant (商家):
  POST /merchant/tasks            — 创建草稿 body: { title, baseAmount?, baseCount?, rankingTotal?, assetAttachments? }
  GET  /merchant/tasks            — 我的任务列表（含分页）
  GET  /merchant/tasks/:id        — 任务详情（含 rewardTags）
  POST /merchant/tasks/:id/publish — 发布任务（escrow 锁定）
  GET  /merchant/tasks/:id/submissions — 投稿列表
  GET  /merchant/wallet           — 钱包快照 { escrowAmount, refundableAmount, tipSpentAmount }
  POST /merchant/uploads          — multipart 上传附件 → { attachments }
  GET  /merchant/uploads/:name    — 读取上传文件
  POST /merchant/submissions/:id/review — body: { approved: boolean, reason? }
  POST /merchant/submissions/:id/tips  — body: { amount }
  POST /merchant/tasks/:id/rewards/ranking — body: { submissionId, amount }
  POST /merchant/tasks/:id/settle — 结算（frozen → available，退款 escrow）

Admin (运营):
  GET  /admin/dashboard           — 仪表盘 { activeTasks, submissionsToday, frozenAmount }
  GET  /admin/tasks               — 任务列表（分页+status筛选）
  GET  /admin/tasks/:id           — 任务详情
  GET  /admin/users               — 用户列表（分页+role筛选）
  GET  /admin/settings            — 系统设置
  PUT  /admin/settings            — 更新设置 body: { key: value }
  POST /admin/tasks/:id/pause     — 暂停任务
  POST /admin/tasks/:id/resume    — 恢复任务
  POST /admin/users/:id/ban       — 封禁用户
  POST /admin/ledger/:id/mark-anomaly — body: { reason }
  GET  /admin/ledger              — 账务台账（分页）
```

**核心实现要点：**
```javascript
import { db } from "@meow/database/db";
import { createRepository } from "@meow/database/repository";
// Bun HTTP Server 用 Bun.file() 读取静态资源
// Demo auth: identifier="merchant@example.com", secret="demo-pass"
```

**验证命令：**
```bash
curl -s http://localhost:26411/health
curl -s -X POST http://localhost:26411/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"merchant@example.com","secret":"demo-pass","client":"admin"}'
```

### 3.2 `apps/api/package.json`

```json
{
  "name": "@meow/api",
  "type": "module",
  "scripts": {
    "dev": "bun run server.js",
    "start": "bun run server.js"
  },
  "dependencies": {
    "@meow/contracts": "workspace:*",
    "@meow/database": "workspace:*",
    "@meow/domain-core": "workspace:*",
    "@meow/domain-finance": "workspace:*",
    "@meow/domain-risk": "workspace:*",
    "@meow/domain-task": "workspace:*",
    "@meow/domain-user": "workspace:*",
    "@meow/storage": "workspace:*"
  }
}
```

### 3.3 `apps/api/uploads/`（保留现有可能的上传文件）

- [x] 3.1 `apps/api/server.js` — Bun HTTP API 服务（P0 阻塞）
- [x] 3.2 `apps/api/package.json`
- [x] 3.3 `apps/api/uploads/`（保留现有可能的上传文件）

---

## ✅ Phase 4 — 前端 App（已完成）

### 4.1 www 落地页（P1，先做 demo）

**`apps/www/index.html`**
- CDN: Tailwind + daisyUI + jQuery
- SPA hash 路由：`#/`
- 页面：Hero + 功能介绍 + 案例 + CTA + Footer
- 链接：`/square/`（创作者）/ `/admin/`（商家/运营）

**`apps/www/styles.css`**
- daisyUI 主题覆盖：主色 `#4f8ef7`

**`apps/www/app.js`**
- 纯静态，jQuery 只做 smooth scroll
- 无需 API 调用

---

### 4.2 admin 运营后台（P2）

**`apps/admin/index.html`**
- daisyUI + sidebar 布局
- CDN: Tailwind + daisyUI + jQuery + Font Awesome
- SPA hash 路由：`#/login` `/#/dashboard` `/#/tasks` `/#/users` `/#/ledger` `/#/settings`

**`apps/admin/styles.css`**
- daisyUI `corporate` 主题
- 侧边栏 + 表格样式

**`apps/admin/app.js`**（约 300 行）
- `API_BASE = "/api"`（通过 entry 网关代理）
- Cookie 管理：`meow_session`
- 登录页 → session 存 localStorage
- 各页面：数据获取 → jQuery DOM 渲染
- 分页、筛选表单

---

### 4.3 square 创作者端（P2）

**`apps/square/index.html`**
- daisyUI mobile-first（底部 TabBar）
- SPA hash：`#/feed` `/#/my-submissions` `/#/earnings` `/#/profile`

**`apps/square/styles.css`**
- 主题色：`#6366f1`（紫色）

**`apps/square/app.js`**（约 400 行）
- 任务卡片列表（带分页）
- 投稿表单（assetUrl + description）
- 钱包数据展示
- 登录状态检查 → 重定向到登录

---

### 4.4 buyer 商家端（P2）

**`apps/buyer/index.html`**
- daisyUI 侧边栏（桌面端）
- SPA hash：`#/dashboard` `/#/tasks` `/#/tasks/new` `/#/tasks/:id` `/#/wallet` `/#/settings`

**`apps/buyer/styles.css`**
- 主题色：`#ff6b35`（橙色）

**`apps/buyer/app.js`**（约 400 行）
- 任务创建表单（title / baseAmount / baseCount / rankingTotal / attachments）
- 附件上传（POST /api/merchant/uploads）
- 投稿审核（approve/reject/tip/ranking）
- 结算操作

- [x] 4.1 www 落地页（P1，先做 demo）
- [x] 4.2 admin 运营后台（P2）
- [x] 4.3 square 创作者端（P2）
- [x] 4.4 buyer 商家端（P2）

---

## ✅ Phase 5 — 部署（已完成）

### 5.1 `apps/entry/server.js`（P0 阻塞）

**Bun HTTP 统一网关（替代 nginx + 多端口）：**

```javascript
// 监听 26401，同时：
//   /api/*       → proxy to API (127.0.0.1:26411)
//   /square/*    → serve apps/square/index.html (SPA)
//   /admin/*     → serve apps/admin/index.html (SPA)
//   /buyer/*     → serve apps/buyer/index.html (SPA)
//   /*           → serve apps/www/index.html (SPA)

// 开发模式：spawn bun dev 启动各 app + api
// 生产模式：直接 serve 静态文件 + proxy API

// 验证：
curl http://localhost:26401/api/health   // → 200
curl http://localhost:26401/square/       // → index.html
curl http://localhost:26401/admin/        // → index.html
curl http://localhost:26401/              // → www index.html
```

### 5.2 `deploy-meow.sh`（P1）

**新架构：用 entry 单一网关**

```bash
# 核心流程：
# 1. 无需构建（纯 JS/Bun，无需编译）
# 2. 上传 apps/ + packages/@meow/ 到 /data/meow/
# 3. PM2 启动 entry + api 两个进程
# 4. entry 监听 26401，对外暴露 443/80
# 5. 验证部署
```

### 5.3 `README.md`（P3）

- 新技术栈说明
- Bun 本地开发指南
- 端口配置表
- 部署架构图

- [x] 5.1 `apps/entry/server.js`（P0 阻塞）
- [x] 5.2 `deploy-meow.sh`（P1）
- [x] 5.3 `README.md`（P3）

---

## 优先级

```
P0（阻塞）: 3.1 apps/api/server.js  → 一切依赖它
P0（阻塞）: 5.1 apps/entry/server.js → 网关
P1（核心）: 5.2 deploy-meow.sh
P1（demo）: 4.1 www 落地页（最简单，先出效果）
P2（功能）: 4.2 admin  → 4.3 square  → 4.4 buyer
P3（收尾）: 1.5 / 3.2 / 5.3
```

## 当前文件结构（清理后）

```
apps/
  www/       index.html + styles.css + app.js
  square/    index.html + styles.css + app.js
  admin/     index.html + styles.css + app.js
  buyer/     index.html + styles.css + app.js
  api/       server.js + package.json
  entry/     server.js + package.json
  wechat-miniapp/  (保留，不迁移)

packages/
  contracts/       index.js ✅
  database/        db.js ✅ / seed.js ✅ / schema.js ✅ / repository.js ✅
  domain-core/     index.js ✅
  domain-finance/  index.js ✅
  domain-task/     index.js ✅
  domain-user/     index.js ✅
  domain-risk/     index.js ✅
  storage/         index.js ✅
```

## 已验证

```bash
bun test apps/api/server.test.js
bun test apps/entry/server.test.js
```

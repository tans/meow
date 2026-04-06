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

---

## 生产架构

### 服务架构图

```
                              ┌─────────────────────────────────┐
                              │     Docker (1Panel 管理)        │
                              │  ┌───────────────────────────┐  │
                              │  │   OpenResty (nginx)       │  │
                              │  │   容器内端口 80 / 443      │  │
                              │  │                           │  │
                              │  │   / -> proxy.conf -> 静态  │  │
                              │  │   /square/ -> alias        │  │
                              │  │   /admin/ -> alias         │  │
                              │  │   /buyer/ -> alias         │  │
                              │  │   /api/ -> entry:26401     │  │
                              │  └───────────────────────────┘  │
                              └──────────────┬──────────────────┘
                                             │ 80/443
                                             ▼
                                    ┌─────────────────┐
                                    │   meow.ali.     │
                                    │   minapp.xin     │
                                    │   (DNS → 此 IP)  │
                                    └─────────────────┘

                              ┌─────────────────────────────────┐
                              │       宿主机 (服务器)            │
                              │                                 │
                              │  entry (:26401)                 │
                              │   ├─► api (:26411) + PM2        │
                              │   ├─► square (:26412)           │
                              │   ├─► admin (:26413)           │
                              │   └─► buyer (:26414)            │
                              │                                 │
                              │  /www/sites/meow.ali.minapp.xin/│
                              │   ├── index.html               │
                              │   ├── square/  (Vite build)    │
                              │   ├── admin/   (Vite build)    │
                              │   └── buyer/   (Vite build)    │
                              │                                 │
                              │  挂载点 ←──────┐                 │
                              │               │                 │
                              │               ▼                 │
                              │  Docker 容器内 /www/sites/.../  │
                              │  (nginx proxy.conf 读取此目录)   │
                              └─────────────────────────────────┘
```

### 各层职责

| 组件 | 职责 | 管理方式 |
|------|------|---------|
| **Docker OpenResty** | 流量入口，SSL 终结，静态文件服务，API 反向代理到 entry | 1Panel 管理，勿直接改 confd |
| **proxy.conf** | 挂载到容器内 `/www/sites/meow.ali.minapp.xin/`，nginx 读取此文件路由 | 在宿主机编辑，`docker exec` 查看是否生效 |
| **entry** | 开发时统一入口进程，生产时只跑 API（PM2） | `pm2 start` 管理 |
| **API** | 所有业务逻辑，数据库读写 | PM2 |
| **Vite 构建产物** | Square / Admin / Buyer 的静态文件 | `deploy-meow.sh` 上传 |

### 部署流程（deploy-meow.sh）

1. **构建**：在宿主机跑 `pnpm build` 生成各 app 的 `dist/`
2. **上传**：通过 SSH/SCP 将 `dist/` 打包上传到 `/www/sites/meow.ali.minapp.xin/`
3. **路径修正**：Vite build 的 base 为 `/square/`、`/admin/`、`/buyer/`，部署时批量替换为绝对路径
4. **Docker 重载**：SSH 到宿主机执行 `docker exec 1Panel-openresty-xxx nginx -s reload` 让 nginx 重新读取 proxy.conf
5. **验证**：check_url 逐个端点健康检查

### nginx proxy.conf 结构（实际生效）

```nginx
# 静态文件别名（构建产物由 deploy-meow.sh 上传到宿主机挂载点）
location /square/ { alias /www/sites/meow.ali.minapp.xin/square/; }
location /admin/  { alias /www/sites/meow.ali.minapp.xin/admin/; }
location /buyer/  { alias /www/sites/meow.ali.minapp.xin/buyer/; }

# API 反向代理到 entry 进程（entry 再路由到 api :26411）
location /api/ {
    proxy_pass http://127.0.0.1:26401/;
    # ... 标准 proxy headers
}
```

> `nginx-meow.conf` 是本地开发参考配置，与服务器上的 Docker nginx 无关，勿直接部署到服务器。

### 本地开发 vs 生产

| 对比 | 本地开发 | 生产 |
|------|---------|------|
| 入口 | `pnpm run entry`（entry spawn 所有服务） | Docker nginx → entry:26401 |
| 路由 | entry 按路径分发给各 Vite dev server | nginx 按路径 alias 到静态文件 |
| API | entry → api (:26411) | nginx → entry (:26401) → api (:26411) |
| 静态资源 | Vite dev server 提供 HMR | Nginx 直接 serve 构建产物 |
| SSL | Vite dev server（浏览器信任 localhost）| Docker OpenResty（1Panel 管理的证书）|

### 常见问题

**Q: 修改 nginx 配置后不生效？**  
A: 服务器上用 `docker exec <container> nginx -t` 验证语法，然后用 `docker exec <container> nginx -s reload` 重载。不确定容器名时用 `docker ps --format '{{.Names}}'` 查找（通常含 `1Panel-openresty`）。

**Q: SSL 证书报错？**  
A: 证书由 1Panel 管理，在 1Panel 界面操作。`nginx-meow.conf` 里的证书路径仅供参考，服务器上不需要。

**Q: /api/ 返回 502？**  
A: 说明 entry 进程挂了。用 `pm2 list` 检查 API 是否在跑，或重启 `pm2 restart meow-api`。

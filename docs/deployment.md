# Meow 部署文档

本文档面向当前仓库的 MVP 版本，覆盖以下四个运行面：

- `apps/api`: Hono + Node.js API 服务
- `apps/web`: 用户 Web 端
- `apps/admin`: 运营后台 Web 端
- `apps/wechat-miniapp`: 微信小程序原生工程

当前版本最稳妥的部署方式是：

- `apps/api` 作为唯一后端进程独立运行
- `apps/web` 和 `apps/admin` 构建为静态资源
- 用同一个域名反向代理 API 路径到 `apps/api`
- 微信小程序单独在微信开发者工具中上传发布，并指向线上 API 域名

## 1. 部署前提

### 1.1 运行环境

- Node.js `22.x`
- `pnpm 10.x`
- Linux/macOS 服务器一台
- 一个可写目录用于 SQLite 数据文件
- 一个 HTTPS 域名

仓库已经通过以下约束固定了运行时：

- 根目录 [package.json](/Users/ke/code/meow/package.json) 要求 Node `>=22.0.0`
- 根目录 [.nvmrc](/Users/ke/code/meow/.nvmrc) 固定为 `22`

### 1.2 当前部署约束

当前代码有两个需要特别注意的地方：

- `apps/web` 和 `apps/admin` 都通过相对路径调用 `/auth/*`、`/creator/*`、`/merchant/*`、`/admin/*`
- 微信小程序当前在 [apps/wechat-miniapp/miniprogram/app.js](/Users/ke/code/meow/apps/wechat-miniapp/miniprogram/app.js) 中写死了 `apiBaseUrl`

这意味着：

- Web 和 Admin 不能随意放到和 API 完全不同的 origin，除非你自己补 CORS、cookie 和 API Base URL 配置
- 小程序发布前必须把 `apiBaseUrl` 改成线上 HTTPS 地址

## 2. 环境变量

API 当前实际使用的环境变量如下：

- `PORT`
  - API 监听端口
  - 默认值：`3001`
- `MEOW_DB_PATH`
  - SQLite 数据文件路径
  - 默认值：`meow.sqlite`
- `MEOW_DEMO_AUTH`
  - 是否开启 demo 登录
  - 生产演示环境如果还需要用 `operator@example.com` / `hybrid@example.com` 等账号登录，必须设为 `true`
- `MEOW_AUTH_MODE`
  - 可选值之一是 `demo`
  - 和 `MEOW_DEMO_AUTH=true` 作用相同，二选一即可
- `MEOW_DEMO_SEED`
  - 是否在非测试环境启动时写入 demo 数据
  - 首次部署演示环境可以设为 `true`
- `MEOW_COOKIE_SECURE`
  - 是否给 `meow_session` 加 `Secure`
  - 线上 HTTPS 环境应设为 `true`

这些变量的来源可以在以下文件看到：

- [apps/api/src/index.ts](/Users/ke/code/meow/apps/api/src/index.ts)
- [apps/api/src/lib/db.ts](/Users/ke/code/meow/apps/api/src/lib/db.ts)
- [apps/api/src/routes/auth.ts](/Users/ke/code/meow/apps/api/src/routes/auth.ts)

## 3. 推荐目录结构

单机部署时建议使用类似目录：

```text
/srv/meow/
  current/
  shared/
    data/meow.sqlite
    logs/
  releases/
```

如果你用 Git 直接部署到一台机器，也至少要把 SQLite 放在仓库目录外面，避免发布时误删。

## 4. 构建步骤

在服务器或构建机执行：

```bash
pnpm install --frozen-lockfile
pnpm build
```

如果需要在上线前跑完整校验，执行：

```bash
pnpm smoke
```

当前 `smoke` 会串行执行：

- database 测试
- API 测试
- web 构建
- admin 构建
- 小程序 JS 检查
- harness 回归

## 5. API 部署

### 5.1 启动参数

最小生产启动方式：

```bash
PORT=3001 \
MEOW_DB_PATH=/srv/meow/shared/data/meow.sqlite \
MEOW_COOKIE_SECURE=true \
MEOW_DEMO_AUTH=true \
MEOW_DEMO_SEED=true \
node apps/api/dist/index.js
```

说明：

- 当前仓库还没有单独的 `start` 脚本，直接执行编译产物即可
- 如果不是演示环境，后续应该关闭 `MEOW_DEMO_AUTH`，并接真实认证
- `MEOW_DEMO_SEED=true` 建议只在首次初始化或演示环境使用

### 5.2 systemd 示例

```ini
[Unit]
Description=Meow API
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/meow/current
Environment=PORT=3001
Environment=MEOW_DB_PATH=/srv/meow/shared/data/meow.sqlite
Environment=MEOW_COOKIE_SECURE=true
Environment=MEOW_DEMO_AUTH=true
Environment=MEOW_DEMO_SEED=true
ExecStart=/usr/bin/node /srv/meow/current/apps/api/dist/index.js
Restart=always
RestartSec=3
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

## 6. Web 与 Admin 部署

### 6.1 构建产物

构建后静态文件位置：

- Web: `apps/web/dist`
- Admin: `apps/admin/dist`

### 6.2 推荐路由方案

推荐把三类流量挂到同一域名：

- `/` -> `apps/web/dist`
- `/operator` -> `apps/admin/dist`
- `/auth/*`、`/creator/*`、`/merchant/*`、`/admin/*`、`/health` -> API `127.0.0.1:3001`

原因：

- Web 和 Admin 都使用相对路径 fetch
- 当前 session 依赖 cookie
- 同域部署可以避免额外处理跨域 cookie 问题

### 6.3 Nginx 示例

```nginx
server {
    listen 443 ssl http2;
    server_name meow.example.com;

    root /srv/meow/current/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /operator/ {
        alias /srv/meow/current/apps/admin/dist/;
        try_files $uri $uri/ /operator/index.html;
    }

    location ~ ^/(auth|creator|merchant|admin|health) {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

如果你要把 Admin 单独放到 `admin.meow.example.com`，需要额外处理：

- 前端 API Base URL
- Cookie 域
- 跨域请求与凭证

当前代码尚未内建这一套配置，默认不建议这么部署。

## 7. 微信小程序部署

### 7.1 修改 API 地址

发布前先修改：

- [apps/wechat-miniapp/miniprogram/app.js](/Users/ke/code/meow/apps/wechat-miniapp/miniprogram/app.js)

把：

```js
apiBaseUrl: "http://127.0.0.1:3000"
```

改成线上 HTTPS 地址，例如：

```js
apiBaseUrl: "https://meow.example.com"
```

注意：

- 这里必须是 HTTPS
- 该域名必须在微信公众平台配置为合法 request 域名

### 7.2 发布流程

1. 用微信开发者工具打开 [apps/wechat-miniapp/project.config.json](/Users/ke/code/meow/apps/wechat-miniapp/project.config.json) 所在目录
2. 确认 `appid`、请求域名和体验版设置正确
3. 执行一次本地检查：

```bash
pnpm --filter @meow/wechat-miniapp typecheck
```

4. 在微信开发者工具中预览、上传
5. 在微信公众平台提交审核并发布

### 7.3 小程序 session 注意事项

当前小程序实现通过 `wx.request` 手动附带 `cookie` 请求头，并在登录后缓存服务端下发的 `meow_session`。这要求：

- 线上 API 必须稳定返回 `Set-Cookie`
- 反向代理不能吞掉 `Set-Cookie`
- 登录和后续业务请求必须命中同一 API 域名

## 8. 首次上线建议

首次上线建议使用“演示可登录”模式：

```bash
MEOW_DEMO_AUTH=true
MEOW_DEMO_SEED=true
MEOW_COOKIE_SECURE=true
```

这样可以直接使用当前 demo 账号验证三端：

- 创作者 / 商家混合账号：`hybrid@example.com`
- 商家账号：`merchant@example.com`
- 创作者账号：`creator@example.com`
- 运营账号：`operator@example.com`
- 口令：`demo-pass`

## 9. 上线后验收

### 9.1 健康检查

访问：

```text
GET /health
```

期望返回：

```json
{
  "ok": true,
  "service": "meow-api",
  "surfaces": ["web", "wechat-miniapp", "admin", "api"]
}
```

### 9.2 Web 验收

- 用户端能登录
- 用户端能在 creator / merchant 之间切换角色
- 商家可以看到任务列表
- 创作者可以看到公开任务列表

### 9.3 Admin 验收

- `operator@example.com` 可以登录后台
- Dashboard 能正常加载
- 任务页点击“暂停任务”后可触发真实 `/admin/tasks/:taskId/pause`
- 账本页能看到 operator action 生成的记录

### 9.4 小程序验收

- 小程序启动后可以自动 bootstrap session
- 个人页切换角色后，不会再用旧角色 session 访问商家接口
- 收益页能够按当前角色读取正确的钱包接口

## 10. 回滚策略

建议至少保留两类回滚能力：

- 代码回滚：回到上一个 Git tag 或 release 目录
- 数据回滚：备份 `meow.sqlite`

SQLite 回滚最简单的方案是发布前复制一份：

```bash
cp /srv/meow/shared/data/meow.sqlite /srv/meow/shared/data/meow.sqlite.bak
```

如果新版本异常：

1. 停掉 API 进程
2. 回退代码
3. 恢复 SQLite 备份
4. 重启 API

## 11. 当前限制

这份部署文档基于仓库当前实现，以下限制仍然存在：

- 认证还是 demo 模式，不适合真实生产用户
- Web/Admin 没有独立的运行时 API Base URL 配置
- 小程序 API 地址仍需手工改代码
- SQLite 适合 MVP 和中低并发，不适合多实例横向扩展

如果下一步要进入正式生产环境，建议优先补：

- 正式登录体系
- 前端可配置 API Base URL
- 小程序环境配置分层
- 数据库从 SQLite 升级到托管关系型数据库

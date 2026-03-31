# Meow 接口文档

本文档基于当前仓库实现整理，覆盖：

- API 服务：`apps/api`
- 用户 Web / 小程序共用接口：`/auth`、`/creator`、`/merchant`
- 管理端接口：`/admin`

当前版本接口前缀来自 [app.ts](/Users/ke/code/meow/apps/api/src/app.ts)，实际挂载如下：

- `/health`
- `/auth/*`
- `/creator/*`
- `/merchant/*`
- `/admin/*`

## 1. 基础说明

### 1.1 Base URL

开发环境默认 API 地址：

- `http://127.0.0.1:3001`

Web 与 Admin 当前都按同源方式访问相对路径：

- `/auth/*`
- `/creator/*`
- `/merchant/*`
- `/admin/*`

### 1.2 认证方式

当前使用 Cookie Session。

- Cookie 名称：`meow_session`
- 写入时机：`POST /auth/login`
- 作用域：`/`
- 属性：`HttpOnly`、`SameSite=Lax`
- 有效期：7 天
- `Secure` 取决于环境变量 `MEOW_COOKIE_SECURE=true`

除 `/health`、`/auth/login` 之外，其余接口都要求已登录会话。

### 1.3 Demo 账号

仅在 `MEOW_DEMO_AUTH=true` 或 `MEOW_AUTH_MODE=demo` 时可用。

默认口令统一为：

- `demo-pass`

默认账号来自 [seed.ts](/Users/ke/code/meow/packages/database/src/seed.ts)：

- 创作者：`creator@example.com`
- 需求方：`merchant@example.com`
- 混合账号：`hybrid@example.com`
- 管理员：`operator@example.com`

说明：

- 混合账号登录后默认激活 `creator`
- 管理端账号登录后激活 `operator`

### 1.4 Content-Type

- 普通接口：`application/json`
- 素材上传：`multipart/form-data`

### 1.5 通用错误格式

当前业务错误统一返回：

```json
{
  "error": "invalid session"
}
```

已使用的状态码：

- `400` 请求体非法
- `401` 未登录或会话无效
- `403` 角色无权限或当前状态不允许
- `404` 资源不存在

## 2. 健康检查

### GET `/health`

用途：

- 服务健康检查

返回示例：

```json
{
  "ok": true,
  "service": "meow-api",
  "surfaces": ["web", "wechat-miniapp", "admin", "api"]
}
```

## 3. 认证接口

### POST `/auth/login`

用途：

- 登录并写入 `meow_session` Cookie

请求体：

```json
{
  "identifier": "hybrid@example.com",
  "secret": "demo-pass",
  "client": "web"
}
```

字段说明：

- `identifier: string`
- `secret: string`
- `client: "web" | "miniapp" | "admin"`

返回：

```json
{
  "sessionId": "session-1",
  "userId": "hybrid-1",
  "activeRole": "creator",
  "roles": ["creator", "merchant"],
  "user": {
    "id": "hybrid-1",
    "displayName": "Demo Hybrid"
  }
}
```

可能错误：

- `400 invalid auth input`
- `401 invalid credentials`
- `403 demo auth disabled`

### GET `/auth/session`

用途：

- 获取当前会话

返回：

```json
{
  "sessionId": "session-1",
  "userId": "hybrid-1",
  "activeRole": "creator",
  "roles": ["creator", "merchant"]
}
```

可能错误：

- `401 missing session`
- `401 invalid session`

### POST `/auth/switch-role`

用途：

- 在当前会话下切换角色

请求体：

```json
{
  "role": "merchant"
}
```

返回：

```json
{
  "sessionId": "session-1",
  "userId": "hybrid-1",
  "activeRole": "merchant",
  "roles": ["creator", "merchant"]
}
```

可能错误：

- `400 invalid role input`
- `401 invalid session`
- `403 role access denied`

## 4. 创作者接口

要求：

- 当前激活角色必须为 `creator`

### GET `/creator/tasks`

用途：

- 获取公开任务列表

返回：

```json
[
  {
    "id": "task-1",
    "merchantId": "merchant-1",
    "status": "published"
  }
]
```

### GET `/creator/tasks/:taskId`

用途：

- 获取创作者视角的任务详情

返回：

```json
{
  "id": "task-1",
  "merchantId": "merchant-1",
  "status": "published",
  "creatorSubmissionCount": 1
}
```

说明：

- `draft` 任务不可查看
- `status` 可能为：`published | paused | ended | settled | closed`

### GET `/creator/tasks/:taskId/submissions`

用途：

- 获取当前创作者在某任务下的投稿记录

返回：

```json
[
  {
    "id": "submission-1",
    "taskId": "task-1",
    "creatorId": "creator-1",
    "status": "submitted",
    "rewardTags": [],
    "assetUrl": "https://example.com/work.png",
    "description": "首版投稿说明"
  }
]
```

### GET `/creator/submissions`

用途：

- 获取当前创作者全部投稿

返回结构同 `/creator/tasks/:taskId/submissions`

### GET `/creator/wallet`

用途：

- 获取创作者钱包快照

返回：

```json
{
  "creatorId": "creator-1",
  "frozenAmount": 1,
  "availableAmount": 0,
  "submissionCount": 3
}
```

### POST `/creator/tasks/:taskId/submissions`

用途：

- 创建投稿

请求体：

```json
{
  "assetUrl": "https://example.com/work.png",
  "description": "首版投稿说明"
}
```

返回：

```json
{
  "id": "submission-1",
  "taskId": "task-1",
  "creatorId": "creator-1",
  "assetUrl": "https://example.com/work.png",
  "description": "首版投稿说明",
  "status": "submitted"
}
```

可能错误：

- `400 invalid submission json`
- `400 invalid submission input`
- `403 task is not published`
- `404 task not found`

### PATCH `/creator/submissions/:submissionId`

用途：

- 编辑已提交但尚未进入不可编辑状态的投稿

请求体：

```json
{
  "assetUrl": "https://example.com/work-v2.png",
  "description": "更新后的投稿说明"
}
```

返回结构同创建投稿。

可能错误：

- `400 invalid submission json`
- `400 invalid submission input`
- `403 creator does not own submission`
- `403 submission is not editable`
- `404 submission not found`

### POST `/creator/submissions/:submissionId/withdraw`

用途：

- 撤回投稿

返回：

```json
{
  "submissionId": "submission-1",
  "status": "withdrawn"
}
```

可能错误：

- `403 creator does not own submission`
- `403 submission cannot be withdrawn`
- `404 submission not found`

## 5. 需求方接口

要求：

- 当前激活角色必须为 `merchant`

### GET `/merchant/tasks`

用途：

- 获取当前需求方任务列表

返回：

```json
[
  {
    "id": "task-1",
    "merchantId": "merchant-1",
    "title": "夏日探店需求",
    "status": "published",
    "escrowLockedAmount": 3,
    "submissionCount": 0,
    "assetAttachments": [
      {
        "id": "asset-1",
        "kind": "image",
        "url": "/merchant/uploads/asset-1.png",
        "fileName": "brief-1.png",
        "mimeType": "image/png"
      }
    ]
  }
]
```

### GET `/merchant/tasks/:taskId`

用途：

- 获取单个需求详情

返回：

```json
{
  "id": "task-1",
  "merchantId": "merchant-1",
  "title": "夏日探店需求",
  "status": "published",
  "escrowLockedAmount": 3,
  "submissionCount": 2,
  "rewardTags": ["base", "tip"],
  "assetAttachments": [
    {
      "id": "asset-1",
      "kind": "image",
      "url": "/merchant/uploads/asset-1.png",
      "fileName": "brief-1.png",
      "mimeType": "image/png"
    }
  ]
}
```

### POST `/merchant/tasks`

用途：

- 创建需求草稿

请求体：

```json
{
  "title": "夏日探店需求",
  "baseAmount": 3,
  "baseCount": 2,
  "rankingTotal": 1,
  "assetAttachments": [
    {
      "id": "asset-1",
      "kind": "image",
      "url": "/merchant/uploads/asset-1.png",
      "fileName": "brief-1.png",
      "mimeType": "image/png"
    }
  ]
}
```

字段说明：

- `title: string`
- `baseAmount?: number`
- `baseCount?: number`
- `rankingTotal?: number`
- `assetAttachments: MerchantTaskAttachment[]`

返回：

```json
{
  "taskId": "task-1",
  "status": "draft"
}
```

当前实现说明：

- 后端已持久化：`title`、`assetAttachments`
- `baseAmount`、`baseCount`、`rankingTotal` 当前主要用于前端链路兼容，尚未在任务仓储中单独持久化
- 发布时锁定金额仍走当前资金域默认配置，不直接按这三个字段计算

### POST `/merchant/tasks/:taskId/publish`

用途：

- 发布草稿任务并锁定托管预算

返回：

```json
{
  "id": "task-1",
  "merchantId": "merchant-1",
  "status": "published",
  "ledgerEffect": "merchant_escrow_locked"
}
```

可能错误：

- `403 merchant does not own task`
- `404 task not found`

### GET `/merchant/tasks/:taskId/submissions`

用途：

- 获取某需求下的投稿审核列表

返回：

```json
[
  {
    "id": "submission-1",
    "taskId": "task-1",
    "creatorId": "creator-1",
    "status": "approved",
    "rewardTags": ["base"]
  }
]
```

### POST `/merchant/uploads`

用途：

- 上传需求素材

请求方式：

- `multipart/form-data`
- 字段名：`files`
- 支持多文件

支持类型来自 [uploads.ts](/Users/ke/code/meow/apps/api/src/lib/uploads.ts)：

- 图片：`png`、`jpg`、`jpeg`、`webp`、`gif`
- 视频：`mp4`、`mov`、`webm`

返回：

```json
{
  "attachments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "kind": "image",
      "url": "/merchant/uploads/550e8400-e29b-41d4-a716-446655440000.png",
      "fileName": "brief-1.png",
      "mimeType": "image/png"
    }
  ]
}
```

可能错误：

- `400 missing upload files`
- `400 unsupported upload type`

### GET `/merchant/uploads/:storageName`

用途：

- 读取已上传素材文件内容

鉴权说明：

- 只要求存在有效会话，不强制当前角色为 `merchant`

返回：

- 二进制文件流
- `Content-Type` 由文件扩展名推断

### GET `/merchant/wallet`

用途：

- 获取需求方钱包快照

返回：

```json
{
  "merchantId": "merchant-1",
  "escrowAmount": 3,
  "refundableAmount": 1,
  "tipSpentAmount": 1,
  "publishedTaskCount": 2
}
```

### POST `/merchant/submissions/:submissionId/review`

用途：

- 审核投稿

请求体：

```json
{
  "decision": "approved"
}
```

说明：

- `decision` 可选
- 可选值：`approved | rejected`
- 省略时按 `approved` 处理

返回：

```json
{
  "submissionId": "submission-1",
  "status": "approved",
  "rewardType": "base",
  "rewardStatus": "frozen"
}
```

### POST `/merchant/submissions/:submissionId/tips`

用途：

- 发放打赏

返回：

```json
{
  "submissionId": "submission-1",
  "taskId": "task-1",
  "rewardType": "tip",
  "rewardStatus": "frozen",
  "amount": 1
}
```

### POST `/merchant/tasks/:taskId/rewards/ranking`

用途：

- 发放排名奖

请求体：

```json
{
  "submissionId": "submission-1"
}
```

返回：

```json
{
  "submissionId": "submission-1",
  "taskId": "task-1",
  "rewardType": "ranking",
  "rewardStatus": "frozen",
  "amount": 1
}
```

### POST `/merchant/tasks/:taskId/settle`

用途：

- 执行任务结算

返回：

```json
{
  "taskId": "task-1",
  "status": "settled",
  "creatorAvailableDelta": 1,
  "merchantRefundDelta": 1
}
```

## 6. 管理端接口

要求：

- 当前激活角色必须为 `operator`

### 管理端当前实际调用

当前 Admin Web 已直接调用的后端接口：

- `POST /auth/login`
- `GET /auth/session`
- `GET /admin/dashboard`
- `GET /admin/ledger`
- `POST /admin/tasks/:taskId/pause`

### 管理端已实现但前端未全面接入的治理接口

后端已经提供：

- `POST /admin/tasks/:taskId/resume`
- `POST /admin/users/:userId/ban`
- `POST /admin/ledger/:entryId/mark-anomaly`

### 管理端当前尚未服务化的页面数据

以下管理端页面目前仍主要使用前端预览数据，不存在正式 API：

- 任务列表页完整查询接口
- 用户列表查询接口
- 单任务详情查询接口
- 系统设置读取/写入接口

如果后续要联调这些页面，需要先补服务端 read-model API。

### GET `/admin/dashboard`

用途：

- 获取运营总览

返回：

```json
{
  "title": "系统总览",
  "summary": "围绕任务审核、资金流转和风险动作的单日总览。",
  "metrics": [
    {
      "label": "任务总数",
      "value": "3",
      "trend": "基于真实任务仓储"
    }
  ],
  "alerts": [
    {
      "title": "pause-task",
      "detail": "task-1 / 风险复核"
    }
  ]
}
```

### GET `/admin/ledger`

用途：

- 获取运营治理日志

返回：

```json
[
  {
    "id": "operator-action-1",
    "action": "pause-task",
    "targetId": "task-1",
    "targetType": "task",
    "operatorId": "operator-1",
    "reason": "风险复核"
  }
]
```

说明：

- 这里返回的是治理动作日志，不是完整账务流水明细
- Admin 前端当前把它映射成“资金管理”列表展示

### POST `/admin/tasks/:taskId/pause`

用途：

- 暂停任务

请求体：

```json
{
  "reason": "风险复核"
}
```

返回：

```json
{
  "id": "task-1",
  "merchantId": "merchant-1",
  "title": "春季短视频征稿",
  "status": "paused",
  "escrowLockedAmount": 3,
  "assetAttachments": []
}
```

可能错误：

- `400 invalid admin input`
- `403 operator access denied`
- `403 task cannot be paused`
- `404 task not found`

### POST `/admin/tasks/:taskId/resume`

用途：

- 恢复已暂停任务

请求体：

```json
{
  "reason": "复核通过，恢复投放"
}
```

返回结构同暂停任务，`status` 为 `published`。

### POST `/admin/users/:userId/ban`

用途：

- 封禁用户

请求体：

```json
{
  "reason": "违规刷量"
}
```

返回：

```json
{
  "userId": "creator-1",
  "state": "banned"
}
```

### POST `/admin/ledger/:entryId/mark-anomaly`

用途：

- 标记治理日志或账务项异常

请求体：

```json
{
  "reason": "金额异常待复核"
}
```

返回：

```json
{
  "entryId": "ledger-1",
  "status": "flagged",
  "anomalyReason": "金额异常待复核"
}
```

## 7. 接口与前端映射说明

### Web / 小程序主链

主业务链当前覆盖：

1. `/auth/login`
2. `/auth/session`
3. `/auth/switch-role`
4. `/creator/*`
5. `/merchant/*`

### 管理端

当前管理端可稳定联调的最小闭环：

1. `POST /auth/login`
2. `GET /auth/session`
3. `GET /admin/dashboard`
4. `GET /admin/ledger`
5. `POST /admin/tasks/:taskId/pause`

### 已知实现边界

- `POST /merchant/tasks` 已接收预算字段，但预算拆解尚未真正持久化
- `GET /admin/ledger` 目前返回的是治理动作日志，不是完整资金流水
- Admin 的任务列表、用户列表、任务详情、系统设置仍缺正式后端查询接口


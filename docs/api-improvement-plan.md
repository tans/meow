# Admin 管理端 MVP 对接建议（接口盘点 + 完善顺序）

本文聚焦**当前 MVP 阶段**：优先把 Admin 管理端跑通，并明确“哪些接口已可对接、哪些还缺失、下一步先补什么”。

## 1. 现状结论（先给结果）

基于现有接口文档，Admin 侧结论如下：

- **已可直接对接（最小闭环）**：
  1. `POST /auth/login`
  2. `GET /auth/session`
  3. `GET /admin/dashboard`
  4. `GET /admin/ledger`
  5. `POST /admin/tasks/:taskId/pause`
- **后端已实现但前端通常未全接入**：
  1. `POST /admin/tasks/:taskId/resume`
  2. `POST /admin/users/:userId/ban`
  3. `POST /admin/ledger/:entryId/mark-anomaly`
- **当前仍缺正式服务化接口（MVP 需要优先补）**：
  1. 任务列表查询
  2. 用户列表查询
  3. 单任务详情查询
  4. 系统设置读写

> 结论：**Admin 目前“可登录 + 看总览 + 看治理日志 + 暂停任务”可联调；若要真正可运营，必须优先补齐任务/用户查询类 Read API。**

## 2. Admin 页面对接状态清单

| Admin 页面/模块 | 前端是否可真实对接 | 对应接口 | 备注 |
|---|---|---|---|
| 登录页 | 可 | `POST /auth/login` | 使用 operator 角色登录 |
| 登录态恢复 | 可 | `GET /auth/session` | 刷新后恢复会话 |
| 总览看板 | 可 | `GET /admin/dashboard` | 已有真实数据输出 |
| 治理日志/资金管理页（当前语义） | 可（但语义需提示） | `GET /admin/ledger` | 当前返回治理动作日志，不是完整资金流水 |
| 任务暂停操作 | 可 | `POST /admin/tasks/:taskId/pause` | 建议前端强制填写 reason |
| 任务恢复操作 | 基本可（建议补按钮） | `POST /admin/tasks/:taskId/resume` | 后端已实现 |
| 用户封禁操作 | 基本可（建议补入口） | `POST /admin/users/:userId/ban` | 后端已实现 |
| 异常标记操作 | 基本可（建议补入口） | `POST /admin/ledger/:entryId/mark-anomaly` | 后端已实现 |
| 任务列表页 | 不可（缺接口） | - | 需新增 `GET /admin/tasks` |
| 用户列表页 | 不可（缺接口） | - | 需新增 `GET /admin/users` |
| 任务详情页 | 不可（缺接口） | - | 需新增 `GET /admin/tasks/:taskId` |
| 系统设置页 | 不可（缺接口） | - | 需新增 `GET/PUT /admin/settings` |

## 3. MVP 第一优先：先补 4 个 Admin Read API

建议后端优先按下面顺序交付（按运营价值和联调阻塞度排序）：

1. `GET /admin/tasks`
2. `GET /admin/tasks/:taskId`
3. `GET /admin/users`
4. `GET /admin/settings` + `PUT /admin/settings`

### 3.1 `GET /admin/tasks`（最高优先级）

**建议查询参数（MVP 最小集）**：
- `page`（默认 1）
- `pageSize`（默认 20）
- `status`（可选：`draft/published/paused/ended/settled/closed`）
- `keyword`（可选：标题/任务ID）

**建议返回结构**：

```json
{
  "items": [
    {
      "id": "task-1",
      "title": "春季短视频征稿",
      "merchantId": "merchant-1",
      "status": "paused",
      "submissionCount": 12,
      "escrowLockedAmount": 100,
      "updatedAt": "2026-04-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 120
  }
}
```

### 3.2 `GET /admin/tasks/:taskId`

用于任务详情页 + 审核动作前置确认。建议至少包含：
- 基本信息（标题、状态、商家）
- 预算/托管金额快照
- 投稿统计（总数、已审核、待审核）
- 最近治理动作（pause/resume）

### 3.3 `GET /admin/users`

建议支持：
- `page`、`pageSize`
- `state`（`active/banned`）
- `role`（`creator/merchant/operator`）
- `keyword`（用户ID/邮箱/昵称）

### 3.4 `GET/PUT /admin/settings`

MVP 先覆盖：
- 开关项（是否允许新任务发布、是否开启打赏）
- 风控阈值（示例：单任务每日最大奖励额）

## 4. 已有接口的前端对接建议（马上可做）

即便新增接口尚未完成，前端也可以先完善这些能力：

1. 在任务卡片/详情加入“恢复任务”按钮（调用 `resume`）。
2. 在用户详情加入“封禁用户”按钮（调用 `ban`）。
3. 在治理日志列表加入“标记异常”动作（调用 `mark-anomaly`）。
4. 所有 Admin 写操作统一要求填写 `reason`，并做最小长度校验（例如 >= 4 字）。

## 5. Admin 对接验收标准（MVP）

当满足以下条件，可认定 Admin MVP 对接完成：

- 可完成登录、会话恢复、总览查看、日志查看、暂停/恢复任务闭环。
- 可在真实接口下查看任务列表与任务详情。
- 可在真实接口下查看用户列表并执行封禁。
- 系统设置页至少 2 项配置可读可写。
- 所有写操作失败时，前端可展示明确错误文案（含权限不足、资源不存在、状态不允许）。

## 6. 推荐两周排期（MVP）

- **第 1 周**：补 `GET /admin/tasks`、`GET /admin/tasks/:taskId`，前端完成任务列表/详情接入。
- **第 2 周**：补 `GET /admin/users`、`GET/PUT /admin/settings`，前端完成用户与设置页接入，并串通 ban/resume/mark-anomaly 操作。

---

如果你愿意，我下一步可以直接给出一版 **`/admin/tasks`、`/admin/users` 的 OpenAPI 草案**（含请求参数、响应 schema、错误码），你们后端可以直接按草案实现，前端可并行 mock 联调。


## 7. 实现计划（可直接执行）

### 7.1 范围冻结（Day 0）

本轮仅实现以下接口与页面，不扩需求：

- API：`GET /admin/tasks`、`GET /admin/tasks/:taskId`、`GET /admin/users`、`GET/PUT /admin/settings`
- 前端：任务列表页、任务详情页、用户列表页、系统设置页
- 复用既有写接口：`resume`、`ban`、`mark-anomaly`

交付物：
- OpenAPI 草案 v1
- 后端路由 + service + 仓储查询
- 前端页面接入真实 API
- 联调回归清单

### 7.2 后端实现拆解（Day 1-5）

1. **DTO/校验层**
   - 新增 query DTO：分页、状态、关键字、角色、用户状态。
   - 统一参数校验错误返回（400）。
2. **Service 层**
   - `adminTaskQueryService.list()` / `detail()`
   - `adminUserQueryService.list()`
   - `adminSettingsService.get()` / `update()`
3. **Repository 层**
   - 补任务与用户查询条件拼装（状态、关键字、时间倒序）。
   - 保证分页返回 `items + total`。
4. **路由层**
   - 增加 4 个接口并接入 `operator` 鉴权。
5. **日志与审计**
   - settings 写操作记录 operatorId + 变更前后值。

完成定义（DoD）：
- 本地可通过 curl 验证 4 个接口。
- 非 operator 访问返回 403。
- 分页参数非法返回 400。

### 7.3 前端实现拆解（Day 3-7，可并行）

1. **API Client**
   - 新增 admin tasks/users/settings API 方法与类型定义。
2. **页面接入**
   - 任务列表：筛选 + 分页 + 跳详情。
   - 任务详情：展示基础信息与治理操作入口。
   - 用户列表：角色/状态筛选 + 封禁动作。
   - 系统设置：读取、编辑、保存。
3. **动作联动**
   - 在任务详情接 `resume`。
   - 在用户列表或详情接 `ban`。
   - 在治理日志列表接 `mark-anomaly`。
4. **错误处理**
   - 403/404/400 给出明确文案；保存中按钮禁用防重复提交。

完成定义（DoD）：
- 4 个页面不再依赖 mock 数据。
- 写操作有成功/失败反馈与 loading 状态。

### 7.4 联调与测试计划（Day 8-10）

**接口测试（后端）**
- 鉴权：未登录 401、非 operator 403。
- 分页：`page/pageSize` 边界值。
- 过滤：status/state/role/keyword 组合。
- settings：并发更新与参数非法场景。

**联调测试（前后端）**
- 登录 -> dashboard -> tasks -> task detail -> pause/resume。
- users -> ban。
- ledger -> mark-anomaly。
- settings 读写后刷新一致性。

**回归关注点**
- 不影响现有 `/admin/dashboard` 与 `/admin/ledger`。
- 现有商家/创作者端路由行为不回归。

### 7.5 发布计划（Day 11-12）

- 灰度到测试环境（仅内部 operator）。
- 观察 24 小时：错误率、慢查询、5xx。
- 无阻塞问题后发布生产。

### 7.6 风险与预案

- **风险 1：查询性能不足**  
  预案：先加必要索引（task status、updatedAt、user state/role），必要时限制 keyword 模糊匹配范围。
- **风险 2：settings 语义频繁变更**  
  预案：MVP 只放 2-3 个稳定配置项，其他延后。
- **风险 3：前端页面字段不一致**  
  预案：以前端类型文件对齐 OpenAPI，联调前冻结字段名。

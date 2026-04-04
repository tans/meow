# Admin 管理端 MVP 对接复查（完成情况 + 剩余工作）

本文基于当前仓库实现复查 Admin MVP 对接状态，目标是明确：

- 哪些接口已经在后端落地
- 哪些页面已经接入真实 API
- 哪些工作仍未完成，不能误报为“已联调完成”

## 1. 现状结论（先给结果）

基于当前代码、接口路由、测试和 Admin 前端实现，结论如下：

- **后端已完成**：
  1. `GET /admin/tasks`
  2. `GET /admin/tasks/:taskId`
  3. `GET /admin/users`
  4. `GET /admin/settings`
  5. `PUT /admin/settings`
  6. `POST /admin/tasks/:taskId/resume`
  7. `POST /admin/users/:userId/ban`
  8. `POST /admin/ledger/:entryId/mark-anomaly`
- **Admin 前端已接入真实 API 的最小闭环**：
  1. `POST /auth/login`
  2. `GET /auth/session`
  3. `GET /admin/dashboard`
  4. `GET /admin/ledger`
  5. `POST /admin/tasks/:taskId/pause`
- **当前仍未完成的 Admin 对接项**：
  1. 任务列表页切换到 `GET /admin/tasks`
  2. 任务详情页切换到 `GET /admin/tasks/:taskId`
  3. 用户列表页切换到 `GET /admin/users`
  4. 系统设置页切换到 `GET/PUT /admin/settings`
  5. `resume` / `ban` / `mark-anomaly` 的前端入口与联调
  6. 写操作错误态与表单校验补齐

> 结论：**后端接口补齐工作基本完成，但 Admin 前端仍停留在“可登录 + 看总览 + 看治理日志 + 暂停任务”的部分联调状态，还不能认定 Admin MVP 对接完成。**

## 2. Admin 页面对接状态清单

| Admin 页面/模块 | 前端是否可真实对接 | 对应接口 | 备注 |
|---|---|---|---|
| 登录页 | 可 | `POST /auth/login` | 使用 operator 角色登录 |
| 登录态恢复 | 可 | `GET /auth/session` | 刷新后恢复会话 |
| 总览看板 | 可 | `GET /admin/dashboard` | 已有真实数据输出 |
| 治理日志/资金管理页（当前语义） | 可（但语义需提示） | `GET /admin/ledger` | 当前返回治理动作日志，不是完整资金流水 |
| 任务暂停操作 | 可 | `POST /admin/tasks/:taskId/pause` | 建议前端强制填写 reason |
| 任务恢复操作 | 后端可，前端未接入 | `POST /admin/tasks/:taskId/resume` | 缺恢复按钮与联调流程 |
| 用户封禁操作 | 后端可，前端未接入 | `POST /admin/users/:userId/ban` | 缺封禁入口与反馈 |
| 异常标记操作 | 后端可，前端未接入 | `POST /admin/ledger/:entryId/mark-anomaly` | 缺列表动作入口 |
| 任务列表页 | 后端可，前端未完成 | `GET /admin/tasks` | 当前仍主要使用 `taskListPreview` |
| 用户列表页 | 后端可，前端未完成 | `GET /admin/users` | 当前仍主要使用 `userListPreview` |
| 任务详情页 | 后端可，前端未完成 | `GET /admin/tasks/:taskId` | 当前仍主要使用 `taskDetailPreview` |
| 系统设置页 | 后端可，前端未完成 | `GET/PUT /admin/settings` | 当前仍主要使用 `settingsPreview` |

## 3. 后端补齐情况

原计划里优先补的 4 个 Admin Read API 已经落地：

1. `GET /admin/tasks`
2. `GET /admin/tasks/:taskId`
3. `GET /admin/users`
4. `GET /admin/settings` + `PUT /admin/settings`

当前仓库中可见：

- 路由已挂载并接入 `operator` 鉴权
- 查询参数已做基础分页校验
- 对应接口测试已覆盖 tasks / users / settings 读写

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

## 4. 前端剩余对接建议（下一步）

后端接口已具备，前端下一步应优先补这些能力：

1. 在任务卡片/详情加入“恢复任务”按钮（调用 `resume`）。
2. 在用户详情加入“封禁用户”按钮（调用 `ban`）。
3. 在治理日志列表加入“标记异常”动作（调用 `mark-anomaly`）。
4. 所有 Admin 写操作统一要求填写 `reason`，并做最小长度校验（例如 >= 4 字）。

## 5. Admin 对接验收标准（MVP）

当满足以下条件，才可认定 Admin MVP 对接完成：

- 可完成登录、会话恢复、总览查看、日志查看、暂停/恢复任务闭环。
- 可在真实接口下查看任务列表与任务详情。
- 可在真实接口下查看用户列表并执行封禁。
- 系统设置页至少 2 项配置可读可写。
- 所有写操作失败时，前端可展示明确错误文案（含权限不足、资源不存在、状态不允许）。

## 6. 当前复查结论

- **后端接口层**：基本完成
- **后端测试层**：已有接口测试，但鉴权边界、过滤组合、settings 并发更新仍可继续补强
- **Admin 前端接入层**：未完成
- **文档状态**：此前对“缺接口”的判断已过时，需要按当前实现更新

当前最核心的未完成项不是“继续补 Read API”，而是“把 Admin 页面从 preview 数据切到真实 API 并补治理动作入口”。

## 7. 推荐两周排期（按当前状态重排）

- **第 1 周**：前端完成 `GET /admin/tasks`、`GET /admin/tasks/:taskId` 接入，任务列表/详情不再依赖 preview 数据。
- **第 2 周**：前端完成 `GET /admin/users`、`GET/PUT /admin/settings` 接入，并串通 `ban` / `resume` / `mark-anomaly` 操作。

---

如果继续推进，本轮更合适的下一步不是补 OpenAPI 草案，而是直接完成 Admin 前端真实 API 接入与联调回归。


## 8. 实现计划（按当前剩余工作）

### 8.1 范围冻结（Day 0）

本轮收口仅聚焦以下剩余工作，不扩需求：

- 后端：补 `settings` 写操作审计与必要测试
- 前端：任务列表页、任务详情页、用户列表页、系统设置页切到真实 API
- 动作联动：`resume`、`ban`、`mark-anomaly`

交付物：
- 文档复查结论
- 后端审计补丁
- 前端页面接入真实 API
- 联调回归清单

### 8.2 后端剩余事项（Day 1-2）

1. **日志与审计**
   - 补 `settings` 写操作的 operator 审计记录与变更前后快照。
2. **测试补强**
   - 增加 `settings` 审计记录、分页边界、过滤组合、非法参数场景测试。
3. **文档对齐**
   - 保持 `api-reference` 与 `api-improvement-plan` 对当前实现状态一致。

完成定义（DoD）：
- `settings` 更新后可追溯 operator 和变更内容。
- 文档与实现状态一致，不再把已落地接口写成“缺失”。

### 8.3 前端实现拆解（Day 1-7）

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

### 8.4 联调与测试计划（Day 8-10）

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

### 8.5 发布计划（Day 11-12）

- 灰度到测试环境（仅内部 operator）。
- 观察 24 小时：错误率、慢查询、5xx。
- 无阻塞问题后发布生产。

### 8.6 风险与预案

- **风险 1：查询性能不足**  
  预案：先加必要索引（task status、updatedAt、user state/role），必要时限制 keyword 模糊匹配范围。
- **风险 2：settings 语义频繁变更**  
  预案：MVP 只放 2-3 个稳定配置项，其他延后。
- **风险 3：前端页面字段不一致**  
  预案：以前端类型文件对齐 OpenAPI，联调前冻结字段名。

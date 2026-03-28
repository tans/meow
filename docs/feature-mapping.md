# 功能文档映射

## 用户端

### 商家端

- 入驻与个人中心 -> `domain-user`
- 充值、提现、账单、信用 -> `domain-user` + `domain-finance`
- 任务创建、审核、评奖、导出 -> `domain-task`
- 内容效果查看 -> `domain-task` + 后续 `analytics`
- 申诉与纠纷 -> `domain-risk`

### 创作者端

- 注册实名、账户中心 -> `domain-user`
- 浏览任务、报名、投稿 -> `domain-task`
- 收益、冻结、提现 -> `domain-finance`
- 申诉和反馈 -> `domain-risk`

## 后台

- 系统总览 -> `apps/admin` + 后续 `analytics`
- 用户管理 -> `domain-user`
- 任务管理 -> `domain-task`
- 资金管理 -> `domain-finance`
- 风控与申诉 -> `domain-risk`
- 系统设置与日志 -> `apps/admin` + `domain-core`
- 内容与版权管理 -> `domain-risk` + 后续 `content-governance`

## 三条主闭环

- 商家闭环 -> `merchant-task-lifecycle`
- 创作者闭环 -> `creator-earning-lifecycle`
- 平台闭环 -> `platform-risk-loop`

## MVP 主交易链落点

- API 主链 -> `apps/api`
  覆盖发布任务、创作者投稿、商家审核/奖励/结算。
- 原生小程序主链 -> `apps/wechat-miniapp`
  同一个原生小程序承载商家与创作者体验，通过身份切换进入不同页面。
- 后台运营主链 -> `apps/admin`
  覆盖系统总览、任务管理、资金管理、用户管理和系统设置。
- 场景回放主链 -> `apps/harness`
  当前已回放 `merchant-publish-submit-settle`。

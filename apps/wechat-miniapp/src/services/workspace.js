const merchantStats = [
  { label: "发布中任务", value: "3" },
  { label: "待审核稿件", value: "18" },
  { label: "待结算预算", value: "¥620" }
];

const creatorStats = [
  { label: "可参与任务", value: "26" },
  { label: "待审核投稿", value: "4" },
  { label: "冻结收益", value: "¥180" }
];

const merchantTaskEntries = [
  {
    title: "发布任务",
    meta: "配置奖励预算、截止时间和投稿限制",
    path: "/pages/merchant/task-create/index"
  },
  {
    title: "稿件审核",
    meta: "审核投稿并冻结基础奖/打赏",
    path: "/pages/merchant/review/index"
  },
  {
    title: "任务结算",
    meta: "释放奖励并退回未使用预算",
    path: "/pages/merchant/settlement/index"
  }
];

const creatorTaskEntries = [
  {
    title: "任务池",
    meta: "浏览公开任务并查看奖励规则",
    path: "/pages/creator/task-feed/index"
  },
  {
    title: "编辑投稿",
    meta: "补充素材链接和作品说明",
    path: "/pages/creator/submission-edit/index"
  },
  {
    title: "收益明细",
    meta: "查看冻结收益和可提现余额",
    path: "/pages/creator/earnings/index"
  }
];

export const getTabBarItems = () => [
  { text: "工作台", pagePath: "pages/workspace/index" },
  { text: "任务", pagePath: "pages/tasks/index" },
  { text: "收益", pagePath: "pages/wallet/index" },
  { text: "我的", pagePath: "pages/profile/index" }
];

export const buildWorkspaceModel = (role) =>
  role === "merchant"
    ? {
        title: "商家工作台",
        subtitle: "原生小程序直达发布、审核、结算，不再经过壳层页面。",
        primaryAction: "发布任务",
        stats: merchantStats
      }
    : {
        title: "创作者工作台",
        subtitle: "直接浏览任务池、管理投稿和查看收益状态。",
        primaryAction: "浏览任务池",
        stats: creatorStats
      };

export const buildTaskListModel = (role) =>
  role === "merchant"
    ? {
        title: "商家任务中心",
        subtitle: "发布任务、审核稿件和发起结算都走原生页面。",
        entries: merchantTaskEntries
      }
    : {
        title: "创作者任务中心",
        subtitle: "用原生任务池页查看任务详情并发起投稿。",
        entries: creatorTaskEntries
      };

export const buildWalletModel = (role) =>
  role === "merchant"
    ? {
        title: "商家资金视图",
        summary: "托管预算、退款和打赏支出在原生页查看。",
        highlights: ["托管中 ¥620", "待退款 ¥80", "追加打赏 ¥20"]
      }
    : {
        title: "创作者收益视图",
        summary: "冻结收益与可提现收益分层展示。",
        highlights: ["冻结收益 ¥180", "可提现 ¥320", "本周新增 ¥96"]
      };

export const buildProfileModel = (role) => ({
  title: "身份与偏好",
  subtitle: "同一个小程序同时服务商家和创作者，通过身份切换进入不同原生页面。",
  roleCards: [
    {
      role: "merchant",
      title: "商家身份",
      description: "管理任务发布、审核、奖励和结算。",
      active: role === "merchant"
    },
    {
      role: "creator",
      title: "创作者身份",
      description: "浏览任务、提交作品并查看收益。",
      active: role === "creator"
    }
  ]
});

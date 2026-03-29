const lobbyChannels = ["推荐", "品牌合作", "急单", "同城"].map((label) => ({
  label,
  value: label
}));

const awardsPeriods = ["本周", "本月", "全部"].map((label) => ({
  label,
  value: label
}));

const awardsCategories = ["全部", "美妆", "探店", "穿搭", "家居"].map((label) => ({
  label,
  value: label
}));

const featuredCards = [
  {
    id: "award-1",
    badge: "平台精选",
    title: "春日探店短视频",
    creatorName: "阿梨同学",
    taskName: "奈雪春季探店征稿",
    resultText: "品牌已采用 · 奖金 ¥500",
    actionText: "查看案例"
  },
  {
    id: "award-2",
    badge: "一等奖",
    title: "通勤穿搭图文笔记",
    creatorName: "Momo穿搭",
    taskName: "都市白领穿搭征集",
    resultText: "一等奖 · 奖金 ¥800",
    actionText: "查看案例"
  }
];

const quickLinks = [
  { title: "我的投稿", path: "/pages/creator/task-feed/index" },
  { title: "收益明细", path: "/pages/wallet/index" },
  { title: "草稿箱", path: "/pages/creator/submission-edit/index" },
  { title: "合作记录", path: "/pages/creator/earnings/index" }
];

const creatorStats = [
  { label: "累计获奖", value: "12" },
  { label: "本月投稿", value: "18" },
  { label: "品牌合作", value: "6" },
  { label: "预估收益", value: "¥1,280" }
];

export const getTabBarItems = () => [
  { text: "悬赏大厅", pagePath: "pages/tasks/index" },
  { text: "获奖作品", pagePath: "pages/workspace/index" },
  { text: "我的", pagePath: "pages/profile/index" }
];

export const buildLobbyModel = (activeChannel = "推荐") => ({
  title: "悬赏大厅",
  heroText: "今天有 28 个品牌任务在征稿",
  heroSubtext: "本周探店、穿搭类任务热度上升",
  activeChannel,
  channels: lobbyChannels.map((item) => ({
    ...item,
    active: item.value === activeChannel
  }))
});

export const buildAwardsModel = (
  activePeriod = "本周",
  activeCategory = "全部"
) => ({
  title: "获奖作品",
  featuredTitle: "本周品牌精选",
  featuredDescription: "看见真实获奖案例，理解平台偏好",
  activePeriod,
  activeCategory,
  periods: awardsPeriods.map((item) => ({
    ...item,
    active: item.value === activePeriod
  })),
  categories: awardsCategories.map((item) => ({
    ...item,
    active: item.value === activeCategory
  })),
  featuredCards
});

export const buildProfileModel = (currentRole = "creator") => ({
  title: "我的",
  creatorName: "阿喵创作社",
  creatorBio: "探店 / 美妆 / 穿搭创作者",
  creatorTags: ["探店", "美妆", "穿搭"],
  creatorStatus: "本周已投 6 个任务，入围 2 个",
  stats: creatorStats,
  quickLinks,
  merchantEntry: {
    title: "商家合作",
    description: "需要发布品牌合作任务时，从这里进入商家侧管理",
    actionText: "进入商家侧",
    currentRole
  }
});

export const buildWalletEntryModel = () => ({
  title: "收益明细",
  summary: "查看冻结收益、可提现金额和本周新增"
});

// Keep legacy helpers available during staged shell migration.
export const buildWorkspaceModel = (role) =>
  role === "merchant"
    ? {
        title: "商家工作台",
        subtitle: "原生小程序直达发布、审核、结算，不再经过壳层页面。",
        primaryAction: "发布任务",
        stats: [
          { label: "发布中任务", value: "3" },
          { label: "待审核稿件", value: "18" },
          { label: "待结算预算", value: "¥620" }
        ]
      }
    : {
        title: "创作者工作台",
        subtitle: "直接浏览任务池、管理投稿和查看收益状态。",
        primaryAction: "浏览任务池",
        stats: [
          { label: "可参与任务", value: "26" },
          { label: "待审核投稿", value: "4" },
          { label: "冻结收益", value: "¥180" }
        ]
      };

export const buildTaskListModel = (role) =>
  role === "merchant"
    ? {
        title: "商家任务中心",
        subtitle: "发布任务、审核稿件和发起结算都走原生页面。",
        entries: [
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
        ]
      }
    : {
        title: "创作者任务中心",
        subtitle: "用原生任务池页查看任务详情并发起投稿。",
        entries: [
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
        ]
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

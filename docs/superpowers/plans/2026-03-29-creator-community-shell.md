# Creator Community Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the WeChat mini program shell from a tool-like workspace into a creator-community experience with `悬赏大厅 / 获奖作品 / 我的`, while keeping existing merchant and creator second-level flows reachable.

**Architecture:** Keep the current native mini program route structure and refactor in place: `pages/tasks/index` becomes the lobby, `pages/workspace/index` becomes awards showcase, and `pages/profile/index` becomes the creator profile. Put all shared shell copy and module state in `apps/wechat-miniapp/src/services/workspace.js`, keep task-card presentation logic in `apps/wechat-miniapp/src/view-models/task-feed.js`, and use local community metadata merged onto existing task records instead of changing backend contracts.

**Tech Stack:** Native WeChat Mini Program (`.js/.wxml/.wxss/.json`), plain ES modules in `apps/wechat-miniapp/src`, Vitest, existing local store/task services

---

## File Structure

### Existing files to modify

- `apps/wechat-miniapp/miniprogram/app.json`
- `apps/wechat-miniapp/miniprogram/app.wxss`
- `apps/wechat-miniapp/miniprogram/pages/tasks/index.js`
- `apps/wechat-miniapp/miniprogram/pages/tasks/index.json`
- `apps/wechat-miniapp/miniprogram/pages/tasks/index.wxml`
- `apps/wechat-miniapp/miniprogram/pages/tasks/index.wxss`
- `apps/wechat-miniapp/miniprogram/pages/workspace/index.js`
- `apps/wechat-miniapp/miniprogram/pages/workspace/index.json`
- `apps/wechat-miniapp/miniprogram/pages/workspace/index.wxml`
- `apps/wechat-miniapp/miniprogram/pages/workspace/index.wxss`
- `apps/wechat-miniapp/miniprogram/pages/profile/index.js`
- `apps/wechat-miniapp/miniprogram/pages/profile/index.json`
- `apps/wechat-miniapp/miniprogram/pages/profile/index.wxml`
- `apps/wechat-miniapp/miniprogram/pages/profile/index.wxss`
- `apps/wechat-miniapp/miniprogram/pages/wallet/index.js`
- `apps/wechat-miniapp/miniprogram/pages/wallet/index.json`
- `apps/wechat-miniapp/miniprogram/pages/wallet/index.wxml`
- `apps/wechat-miniapp/src/services/tasks.js`
- `apps/wechat-miniapp/src/services/workspace.js`
- `apps/wechat-miniapp/src/view-models/task-feed.js`
- `apps/wechat-miniapp/src/view-models/workspace.js`
- `apps/wechat-miniapp/src/tests/project-config.test.js`
- `apps/wechat-miniapp/src/tests/task-feed.test.js`
- `apps/wechat-miniapp/src/tests/workspace.test.js`

### New files to create

- `apps/wechat-miniapp/src/tests/community-pages.test.js`

### Responsibility map

- `miniprogram/app.json` owns the actual tab bar and page registration. Keep the wallet page registered even after it leaves the tab bar.
- `src/services/workspace.js` owns top-level shell copy, channels, filters, awards cards, profile cards, and merchant-entry metadata.
- `src/services/tasks.js` owns merging backend task records with local presentation metadata needed by the lobby.
- `src/view-models/task-feed.js` owns the final card shape used by the lobby WXML.
- `pages/tasks/index.*` owns the community lobby page only.
- `pages/workspace/index.*` owns the awards showcase page only.
- `pages/profile/index.*` owns the creator profile page only.
- `pages/wallet/index.*` remains a secondary page reached from `我的`.

### Safety note

The repository already has unrelated modified files. In every commit step below, stage only the listed mini program files. Do not run broad `git add .`.

---

### Task 1: Lock the Community IA in Tests and Shared Shell Models

**Files:**
- Modify: `apps/wechat-miniapp/src/tests/workspace.test.js`
- Modify: `apps/wechat-miniapp/src/tests/project-config.test.js`
- Modify: `apps/wechat-miniapp/src/services/workspace.js`
- Modify: `apps/wechat-miniapp/src/view-models/workspace.js`
- Modify: `apps/wechat-miniapp/miniprogram/app.json`
- Modify: `apps/wechat-miniapp/miniprogram/pages/tasks/index.json`
- Modify: `apps/wechat-miniapp/miniprogram/pages/workspace/index.json`
- Modify: `apps/wechat-miniapp/miniprogram/pages/profile/index.json`
- Modify: `apps/wechat-miniapp/miniprogram/pages/wallet/index.json`

- [ ] **Step 1: Write failing tests for the new tab bar and community page models**

```js
// apps/wechat-miniapp/src/tests/workspace.test.js
import { describe, expect, it } from "vitest";
import {
  buildAwardsModel,
  buildLobbyModel,
  buildProfileModel,
  getTabBarItems
} from "../view-models/workspace.js";

describe("creator community shell models", () => {
  it("returns the three-tab community shell", () => {
    expect(getTabBarItems()).toEqual([
      { text: "悬赏大厅", pagePath: "pages/tasks/index" },
      { text: "获奖作品", pagePath: "pages/workspace/index" },
      { text: "我的", pagePath: "pages/profile/index" }
    ]);
  });

  it("builds the lobby hero and fixed channels", () => {
    expect(buildLobbyModel()).toMatchObject({
      title: "悬赏大厅",
      heroText: "今天有 28 个品牌任务在征稿",
      activeChannel: "推荐"
    });
    expect(buildLobbyModel().channels.map((item) => item.label)).toEqual([
      "推荐",
      "品牌合作",
      "急单",
      "同城"
    ]);
  });

  it("builds awards filters and featured work cards", () => {
    expect(buildAwardsModel()).toMatchObject({
      title: "获奖作品",
      activePeriod: "本周",
      activeCategory: "全部"
    });
    expect(buildAwardsModel().featuredCards[0]).toMatchObject({
      badge: "平台精选",
      actionText: "查看案例"
    });
  });

  it("builds a creator-first profile with a merchant cooperation card", () => {
    expect(buildProfileModel("creator")).toMatchObject({
      title: "我的",
      creatorName: "阿喵创作社",
      merchantEntry: {
        title: "商家合作",
        actionText: "进入商家侧"
      }
    });
    expect(buildProfileModel("creator").quickLinks.map((item) => item.title)).toEqual([
      "我的投稿",
      "收益明细",
      "草稿箱",
      "合作记录"
    ]);
  });
});
```

```js
// apps/wechat-miniapp/src/tests/project-config.test.js
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(process.cwd());
const projectConfigPath = path.join(projectRoot, "project.config.json");
const projectConfig = JSON.parse(readFileSync(projectConfigPath, "utf8"));
const miniProgramRoot = path.resolve(
  projectRoot,
  projectConfig.miniprogramRoot || "."
);
const appConfigPath = path.join(miniProgramRoot, "app.json");
const appConfig = JSON.parse(readFileSync(appConfigPath, "utf8"));

const relativeImportPattern =
  /import\s+[^"'\n]+\s+from\s+["'](\.[^"']+)["']/g;

describe("wechat project config", () => {
  it("keeps page imports inside the declared mini program root", () => {
    const pageFiles = appConfig.pages.map((pagePath) =>
      path.join(miniProgramRoot, `${pagePath}.js`)
    );
    const escapedRoot = `${miniProgramRoot}${path.sep}`;

    pageFiles.forEach((file) => {
      const source = readFileSync(file, "utf8");
      const imports = [...source.matchAll(relativeImportPattern)].map(
        (match) => match[1]
      );

      imports.forEach((specifier) => {
        const resolved = path.resolve(path.dirname(file), specifier);
        expect(
          resolved === miniProgramRoot || resolved.startsWith(escapedRoot),
          `${path.relative(projectRoot, file)} imports ${specifier}, which resolves outside ${path.relative(projectRoot, miniProgramRoot)}`
        ).toBe(true);
      });
    });
  });

  it("exposes the creator-community tab bar and keeps wallet as a secondary page", () => {
    expect(appConfig.tabBar.list).toEqual([
      { pagePath: "pages/tasks/index", text: "悬赏大厅" },
      { pagePath: "pages/workspace/index", text: "获奖作品" },
      { pagePath: "pages/profile/index", text: "我的" }
    ]);
    expect(appConfig.pages).toContain("pages/wallet/index");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test -- workspace.test.js project-config.test.js
```

Expected: FAIL because `buildLobbyModel` / `buildAwardsModel` are not exported yet, and `app.json` still contains `工作台 / 任务 / 收益 / 我的`.

- [ ] **Step 3: Implement the shared shell models and tab/page config**

```js
// apps/wechat-miniapp/src/view-models/workspace.js
export {
  buildAwardsModel,
  buildLobbyModel,
  buildProfileModel,
  buildWalletEntryModel,
  getTabBarItems
} from "../services/workspace.js";
```

```js
// apps/wechat-miniapp/src/services/workspace.js
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
```

```json
// apps/wechat-miniapp/miniprogram/app.json
{
  "pages": [
    "pages/tasks/index",
    "pages/workspace/index",
    "pages/profile/index",
    "pages/wallet/index",
    "pages/merchant/task-create/index",
    "pages/merchant/task-detail/index",
    "pages/merchant/review/index",
    "pages/merchant/settlement/index",
    "pages/creator/task-feed/index",
    "pages/creator/task-detail/index",
    "pages/creator/submission-edit/index",
    "pages/creator/earnings/index"
  ],
  "window": {
    "navigationBarTitleText": "创意喵",
    "navigationBarBackgroundColor": "#fff9f4",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#fff6ee"
  },
  "tabBar": {
    "color": "#7d6c61",
    "selectedColor": "#ff6f3c",
    "backgroundColor": "#fffdf9",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/tasks/index",
        "text": "悬赏大厅"
      },
      {
        "pagePath": "pages/workspace/index",
        "text": "获奖作品"
      },
      {
        "pagePath": "pages/profile/index",
        "text": "我的"
      }
    ]
  }
}
```

```json
// apps/wechat-miniapp/miniprogram/pages/tasks/index.json
{ "navigationBarTitleText": "悬赏大厅" }
```

```json
// apps/wechat-miniapp/miniprogram/pages/workspace/index.json
{ "navigationBarTitleText": "获奖作品" }
```

```json
// apps/wechat-miniapp/miniprogram/pages/profile/index.json
{ "navigationBarTitleText": "我的" }
```

```json
// apps/wechat-miniapp/miniprogram/pages/wallet/index.json
{ "navigationBarTitleText": "收益明细" }
```

- [ ] **Step 4: Run the tests to verify the shared shell passes**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test -- workspace.test.js project-config.test.js
```

Expected: PASS with `workspace.test.js` and `project-config.test.js` both green.

- [ ] **Step 5: Commit the IA and model baseline**

```bash
git add apps/wechat-miniapp/src/tests/workspace.test.js apps/wechat-miniapp/src/tests/project-config.test.js apps/wechat-miniapp/src/services/workspace.js apps/wechat-miniapp/src/view-models/workspace.js apps/wechat-miniapp/miniprogram/app.json apps/wechat-miniapp/miniprogram/pages/tasks/index.json apps/wechat-miniapp/miniprogram/pages/workspace/index.json apps/wechat-miniapp/miniprogram/pages/profile/index.json apps/wechat-miniapp/miniprogram/pages/wallet/index.json
git commit -m "feat: define creator community shell"
```

### Task 2: Rebuild the Lobby Task Cards and `悬赏大厅` Page

**Files:**
- Modify: `apps/wechat-miniapp/src/tests/task-feed.test.js`
- Modify: `apps/wechat-miniapp/src/services/tasks.js`
- Modify: `apps/wechat-miniapp/src/view-models/task-feed.js`
- Modify: `apps/wechat-miniapp/miniprogram/pages/tasks/index.js`
- Modify: `apps/wechat-miniapp/miniprogram/pages/tasks/index.wxml`
- Modify: `apps/wechat-miniapp/miniprogram/pages/tasks/index.wxss`

- [ ] **Step 1: Write the failing task-card mapping test for community cards**

```js
// apps/wechat-miniapp/src/tests/task-feed.test.js
import { describe, expect, it } from "vitest";
import { mapTaskCard } from "../view-models/task-feed.js";

describe("task feed cards", () => {
  it("maps a public task into a community lobby card", () => {
    expect(
      mapTaskCard({
        id: "task-1",
        title: "春日探店短视频",
        brandName: "奈雪",
        category: "探店",
        summary: "到店拍摄 15 秒短视频，突出新品和门店氛围",
        rewardText: "参与奖 50 / 名次奖 500",
        participantCount: 126,
        deadlineText: "距截止 3 天",
        highlightTag: "平台精选",
        coverTheme: "peach"
      })
    ).toMatchObject({
      id: "task-1",
      title: "春日探店短视频",
      brandName: "奈雪",
      category: "探店",
      metaText: "126 人参与 · 距截止 3 天",
      primaryActionText: "立即报名",
      secondaryActionText: "查看详情",
      highlightTag: "平台精选",
      coverClassName: "task-card__cover--peach"
    });
  });

  it("marks closed tasks as ended cards", () => {
    expect(
      mapTaskCard({
        id: "task-2",
        title: "家居图文任务",
        status: "settled",
        brandName: "木墨",
        category: "家居",
        summary: "居家收纳改造分享",
        rewardText: "参与奖 30 / 名次奖 300",
        participantCount: 40,
        deadlineText: "已截止",
        highlightTag: "品牌合作",
        coverTheme: "mint"
      })
    ).toMatchObject({
      statusText: "已截止",
      primaryActionText: "查看详情"
    });
  });
});
```

- [ ] **Step 2: Run the task-card test to verify it fails**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test -- task-feed.test.js
```

Expected: FAIL because `mapTaskCard` does not provide `brandName`, `metaText`, `primaryActionText`, or `coverClassName`.

- [ ] **Step 3: Enrich task records and render the lobby page**

Add the local presentation metadata near the top of `apps/wechat-miniapp/src/services/tasks.js`, then replace only `listPublicTasks` with the version below.

```js
// apps/wechat-miniapp/src/services/tasks.js
import { request } from "./http.js";
import { getStore } from "./store.js";

const communityTaskMetaById = {
  "task-1": {
    brandName: "奈雪",
    category: "探店",
    summary: "到店拍摄 15 秒短视频，突出新品和门店氛围",
    participantCount: 126,
    deadlineText: "距截止 3 天",
    highlightTag: "平台精选",
    coverTheme: "peach"
  },
  "task-2": {
    brandName: "PMPM",
    category: "美妆",
    summary: "记录精华上脸质感，突出真实肤感变化",
    participantCount: 84,
    deadlineText: "距截止 1 天",
    highlightTag: "奖金高",
    coverTheme: "rose"
  },
  "task-3": {
    brandName: "木墨",
    category: "家居",
    summary: "用图文笔记呈现收纳前后对比",
    participantCount: 40,
    deadlineText: "同城可约拍",
    highlightTag: "同城",
    coverTheme: "mint"
  }
};

const getApiBaseUrl = () => {
  const app = getApp();
  return app.globalData.apiBaseUrl;
};

const merchantHeader = () => ({
  "content-type": "application/json",
  "x-demo-user": "merchant-1"
});

const creatorHeader = () => ({
  "content-type": "application/json",
  "x-demo-user": "creator-1"
});

const getRewardText = (input) =>
  `基础奖 ${input.baseAmount} x ${input.baseCount} + 排名奖 ${input.rankingTotal}`;

const getTaskTitle = (taskId) => `原生任务 ${taskId}`;

const getCommunityMeta = (taskId) =>
  communityTaskMetaById[taskId] || {
    brandName: "品牌合作",
    category: "推荐",
    summary: "查看任务详情和奖励规则",
    participantCount: 0,
    deadlineText: "长期征稿",
    highlightTag: "新发布",
    coverTheme: "sand"
  };

export const mergeCreatorTaskDetail = (task, meta = {}) => ({
  id: task.id,
  merchantId: task.merchantId,
  title: meta.title || getTaskTitle(task.id),
  status: task.status,
  rewardText: meta.rewardText || "基础奖+排名奖",
  creatorSubmissionCount: task.creatorSubmissionCount || 0,
  canSubmit: task.status === "published"
});

export const listPublicTasks = async () => {
  const items = await request({
    url: `${getApiBaseUrl()}/creator/tasks`,
    method: "GET",
    header: creatorHeader()
  });

  const store = getStore();

  return items.map((task) => {
    const meta = store.taskMetaById[task.id] || {};
    const communityMeta = getCommunityMeta(task.id);

    return {
      id: task.id,
      merchantId: task.merchantId,
      title: meta.title || getTaskTitle(task.id),
      status: task.status,
      rewardText: meta.rewardText || "基础奖+排名奖",
      ...communityMeta
    };
  });
};
```

```js
// apps/wechat-miniapp/src/view-models/task-feed.js
const coverClassByTheme = {
  peach: "task-card__cover--peach",
  rose: "task-card__cover--rose",
  mint: "task-card__cover--mint",
  sand: "task-card__cover--sand"
};

export const mapTaskCard = (task) => {
  const isOpen = task.status === "published";

  return {
    id: task.id,
    title: task.title,
    brandName: task.brandName,
    category: task.category,
    summary: task.summary,
    rewardText: task.rewardText,
    metaText: `${task.participantCount} 人参与 · ${task.deadlineText}`,
    highlightTag: task.highlightTag,
    statusText: isOpen ? "进行中" : "已截止",
    primaryActionText: isOpen ? "立即报名" : "查看详情",
    secondaryActionText: "查看详情",
    coverClassName:
      coverClassByTheme[task.coverTheme] || coverClassByTheme.sand
  };
};
```

```js
// apps/wechat-miniapp/miniprogram/pages/tasks/index.js
import { listPublicTasks, setSelectedTaskId } from "../../../src/services/tasks.js";
import { buildLobbyModel } from "../../../src/view-models/workspace.js";
import { mapTaskCard } from "../../../src/view-models/task-feed.js";

Page({
  data: {
    title: "",
    heroText: "",
    heroSubtext: "",
    activeChannel: "推荐",
    channels: [],
    cards: [],
    error: ""
  },

  async onShow() {
    await this.loadPage(this.data.activeChannel || "推荐");
  },

  async onChannelTap(event) {
    const { value } = event.currentTarget.dataset;

    if (!value || value === this.data.activeChannel) {
      return;
    }

    await this.loadPage(value);
  },

  async onPullDownRefresh() {
    await this.loadPage(this.data.activeChannel || "推荐");
    wx.stopPullDownRefresh();
  },

  async loadPage(activeChannel) {
    const lobby = buildLobbyModel(activeChannel);

    try {
      const tasks = await listPublicTasks();
      this.setData({
        title: lobby.title,
        heroText: lobby.heroText,
        heroSubtext: lobby.heroSubtext,
        activeChannel,
        channels: lobby.channels,
        cards: tasks.map(mapTaskCard),
        error: ""
      });
    } catch (error) {
      this.setData({
        title: lobby.title,
        heroText: lobby.heroText,
        heroSubtext: lobby.heroSubtext,
        activeChannel,
        channels: lobby.channels,
        cards: [],
        error: error.message || "悬赏大厅加载失败"
      });
    }
  },

  onCardTap(event) {
    const { taskId } = event.currentTarget.dataset;

    if (!taskId) {
      return;
    }

    setSelectedTaskId(taskId);
    wx.navigateTo({ url: `/pages/creator/task-detail/index?taskId=${taskId}` });
  }
});
```

```xml
<!-- apps/wechat-miniapp/miniprogram/pages/tasks/index.wxml -->
<view class="page-shell page-shell--warm">
  <view class="community-hero">
    <view class="community-hero__eyebrow">创作者社区</view>
    <view class="community-hero__title">{{heroText}}</view>
    <view class="community-hero__subtitle">{{heroSubtext}}</view>
  </view>

  <scroll-view class="channel-strip" scroll-x enable-flex>
    <view
      wx:for="{{channels}}"
      wx:key="value"
      class="channel-chip {{item.active ? 'channel-chip--active' : ''}}"
      data-value="{{item.value}}"
      bind:tap="onChannelTap"
    >
      {{item.label}}
    </view>
  </scroll-view>

  <view wx:if="{{cards.length}}" class="task-card-list">
    <view
      wx:for="{{cards}}"
      wx:key="id"
      class="task-card"
      data-task-id="{{item.id}}"
      bind:tap="onCardTap"
    >
      <view class="task-card__cover {{item.coverClassName}}">
        <view class="task-card__tag">{{item.highlightTag}}</view>
        <view class="task-card__status">{{item.statusText}}</view>
      </view>

      <view class="task-card__body">
        <view class="task-card__title">{{item.title}}</view>
        <view class="task-card__summary">{{item.summary}}</view>
        <view class="task-card__brand">{{item.brandName}} · {{item.category}}</view>
        <view class="task-card__reward">{{item.rewardText}}</view>
        <view class="task-card__meta">{{item.metaText}}</view>

        <view class="task-card__actions">
          <view class="task-card__secondary">{{item.secondaryActionText}}</view>
          <view class="task-card__primary">{{item.primaryActionText}}</view>
        </view>
      </view>
    </view>
  </view>

  <view wx:elif="{{error}}" class="native-empty">
    {{error}}
  </view>

  <view wx:else class="native-empty">
    新的品牌合作正在路上
  </view>
</view>
```

```css
/* apps/wechat-miniapp/miniprogram/pages/tasks/index.wxss */
.page-shell--warm {
  background: linear-gradient(180deg, #fff6ee 0%, #fffdf9 260rpx, #fff8f2 100%);
}

.community-hero {
  padding: 36rpx 32rpx;
  border-radius: 36rpx;
  background: linear-gradient(135deg, #ffefe6, #ffe2d1);
  box-shadow: 0 18rpx 42rpx rgba(208, 112, 72, 0.14);
}

.community-hero__eyebrow {
  font-size: 22rpx;
  color: #d86c3d;
  font-weight: 600;
}

.community-hero__title {
  margin-top: 16rpx;
  font-size: 42rpx;
  font-weight: 700;
  color: #2f2018;
}

.community-hero__subtitle {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #7e5848;
}

.channel-strip {
  margin-top: 24rpx;
  white-space: nowrap;
}

.channel-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  padding: 0 28rpx;
  min-height: 64rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.8);
  color: #8d6a5b;
  font-size: 24rpx;
  font-weight: 600;
}

.channel-chip--active {
  background: #ff6f3c;
  color: #ffffff;
  box-shadow: 0 12rpx 24rpx rgba(255, 111, 60, 0.22);
}

.task-card-list {
  display: grid;
  gap: 24rpx;
  margin-top: 24rpx;
}

.task-card {
  overflow: hidden;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 42rpx rgba(62, 39, 27, 0.1);
}

.task-card__cover {
  position: relative;
  height: 220rpx;
  padding: 24rpx;
}

.task-card__cover--peach {
  background: linear-gradient(135deg, #ffd8c6, #ffb693);
}

.task-card__cover--rose {
  background: linear-gradient(135deg, #ffd6de, #ffafbd);
}

.task-card__cover--mint {
  background: linear-gradient(135deg, #daf8ef, #9de0c9);
}

.task-card__cover--sand {
  background: linear-gradient(135deg, #f2e4d4, #debea0);
}

.task-card__tag,
.task-card__status {
  display: inline-flex;
  padding: 0 18rpx;
  min-height: 48rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.85);
  align-items: center;
  font-size: 22rpx;
  font-weight: 600;
  color: #7b4330;
}

.task-card__status {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
}

.task-card__body {
  padding: 28rpx;
}

.task-card__title {
  font-size: 34rpx;
  font-weight: 700;
  color: #2f2018;
}

.task-card__summary,
.task-card__brand,
.task-card__reward,
.task-card__meta {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #7e6457;
}

.task-card__reward {
  color: #d35f30;
  font-weight: 600;
}

.task-card__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24rpx;
}

.task-card__secondary {
  color: #8d6a5b;
  font-size: 24rpx;
}

.task-card__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 64rpx;
  padding: 0 26rpx;
  border-radius: 999rpx;
  background: #ff6f3c;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 600;
}
```

- [ ] **Step 4: Run the task-card tests**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test -- task-feed.test.js
```

Expected: PASS with both community-card mapping tests green.

- [ ] **Step 5: Commit the lobby redesign**

```bash
git add apps/wechat-miniapp/src/tests/task-feed.test.js apps/wechat-miniapp/src/services/tasks.js apps/wechat-miniapp/src/view-models/task-feed.js apps/wechat-miniapp/miniprogram/pages/tasks/index.js apps/wechat-miniapp/miniprogram/pages/tasks/index.wxml apps/wechat-miniapp/miniprogram/pages/tasks/index.wxss
git commit -m "feat: redesign creator bounty lobby"
```

### Task 3: Turn `获奖作品` and `我的` into Community Pages

**Files:**
- Create: `apps/wechat-miniapp/src/tests/community-pages.test.js`
- Modify: `apps/wechat-miniapp/miniprogram/pages/workspace/index.js`
- Modify: `apps/wechat-miniapp/miniprogram/pages/workspace/index.wxml`
- Modify: `apps/wechat-miniapp/miniprogram/pages/workspace/index.wxss`
- Modify: `apps/wechat-miniapp/miniprogram/pages/profile/index.js`
- Modify: `apps/wechat-miniapp/miniprogram/pages/profile/index.wxml`
- Modify: `apps/wechat-miniapp/miniprogram/pages/profile/index.wxss`
- Modify: `apps/wechat-miniapp/miniprogram/pages/wallet/index.js`
- Modify: `apps/wechat-miniapp/miniprogram/pages/wallet/index.wxml`
- Modify: `apps/wechat-miniapp/miniprogram/app.wxss`

- [ ] **Step 1: Write a failing smoke test for the community page source files**

```js
// apps/wechat-miniapp/src/tests/community-pages.test.js
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "miniprogram/pages");

const readPageFile = (pagePath) =>
  readFileSync(path.join(root, pagePath), "utf8");

describe("community page source", () => {
  it("rewrites workspace into an awards showcase page", () => {
    const source = readPageFile("workspace/index.wxml");

    expect(source).toContain("feature-banner");
    expect(source).toContain("award-card");
    expect(source).toContain("award-card__action");
  });

  it("rewrites profile into a creator page with a merchant cooperation card", () => {
    const source = readPageFile("profile/index.wxml");

    expect(source).toContain("profile-hero");
    expect(source).toContain("merchant-card");
    expect(source).toContain("onMerchantEntryTap");
  });

  it("keeps wallet as a secondary earnings page", () => {
    const source = readPageFile("wallet/index.js");

    expect(source).toContain("buildWalletEntryModel");
    expect(source).toContain("收益明细加载失败");
  });
});
```

- [ ] **Step 2: Run the shared-shell test to verify it still fails before page wiring**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test -- community-pages.test.js
```

Expected: FAIL because the current `workspace/index.wxml`, `profile/index.wxml`, and `wallet/index.js` do not contain the community-page structures yet.

- [ ] **Step 3: Wire the awards page, creator profile page, wallet secondary copy, and global styles**

```js
// apps/wechat-miniapp/miniprogram/pages/workspace/index.js
import { buildAwardsModel } from "../../../src/view-models/workspace.js";

Page({
  data: {
    title: "",
    featuredTitle: "",
    featuredDescription: "",
    periods: [],
    categories: [],
    featuredCards: [],
    activePeriod: "本周",
    activeCategory: "全部"
  },

  onShow() {
    this.loadPage(this.data.activePeriod, this.data.activeCategory);
  },

  onPeriodTap(event) {
    const { value } = event.currentTarget.dataset;
    this.loadPage(value || "本周", this.data.activeCategory);
  },

  onCategoryTap(event) {
    const { value } = event.currentTarget.dataset;
    this.loadPage(this.data.activePeriod, value || "全部");
  },

  loadPage(activePeriod, activeCategory) {
    const model = buildAwardsModel(activePeriod, activeCategory);

    this.setData({
      title: model.title,
      featuredTitle: model.featuredTitle,
      featuredDescription: model.featuredDescription,
      periods: model.periods,
      categories: model.categories,
      featuredCards: model.featuredCards,
      activePeriod,
      activeCategory
    });
  }
});
```

```xml
<!-- apps/wechat-miniapp/miniprogram/pages/workspace/index.wxml -->
<view class="page-shell page-shell--warm">
  <view class="feature-banner">
    <view class="feature-banner__title">{{featuredTitle}}</view>
    <view class="feature-banner__subtitle">{{featuredDescription}}</view>
  </view>

  <scroll-view class="filter-strip" scroll-x enable-flex>
    <view
      wx:for="{{periods}}"
      wx:key="value"
      class="filter-chip {{item.active ? 'filter-chip--active' : ''}}"
      data-value="{{item.value}}"
      bind:tap="onPeriodTap"
    >
      {{item.label}}
    </view>
  </scroll-view>

  <scroll-view class="filter-strip filter-strip--secondary" scroll-x enable-flex>
    <view
      wx:for="{{categories}}"
      wx:key="value"
      class="filter-chip filter-chip--light {{item.active ? 'filter-chip--active-light' : ''}}"
      data-value="{{item.value}}"
      bind:tap="onCategoryTap"
    >
      {{item.label}}
    </view>
  </scroll-view>

  <view class="award-card-list">
    <view wx:for="{{featuredCards}}" wx:key="id" class="award-card">
      <view class="award-card__cover">
        <view class="award-card__badge">{{item.badge}}</view>
      </view>
      <view class="award-card__body">
        <view class="award-card__title">{{item.title}}</view>
        <view class="award-card__creator">{{item.creatorName}}</view>
        <view class="award-card__task">{{item.taskName}}</view>
        <view class="award-card__result">{{item.resultText}}</view>
        <view class="award-card__action">{{item.actionText}}</view>
      </view>
    </view>
  </view>
</view>
```

```css
/* apps/wechat-miniapp/miniprogram/pages/workspace/index.wxss */
.feature-banner {
  padding: 34rpx;
  border-radius: 36rpx;
  background: linear-gradient(135deg, #ffe4cc, #ffc89f);
  box-shadow: 0 16rpx 36rpx rgba(215, 112, 68, 0.16);
}

.feature-banner__title {
  font-size: 40rpx;
  font-weight: 700;
  color: #332118;
}

.feature-banner__subtitle {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #7f5c4d;
}

.filter-strip {
  margin-top: 24rpx;
  white-space: nowrap;
}

.filter-strip--secondary {
  margin-top: 16rpx;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  min-height: 60rpx;
  padding: 0 26rpx;
  border-radius: 999rpx;
  background: #fff0e7;
  color: #8d583c;
  font-size: 24rpx;
  font-weight: 600;
}

.filter-chip--light {
  background: #ffffff;
  color: #9b7d6d;
}

.filter-chip--active {
  background: #ff7c48;
  color: #ffffff;
}

.filter-chip--active-light {
  background: #2f2018;
  color: #ffffff;
}

.award-card-list {
  display: grid;
  gap: 24rpx;
  margin-top: 24rpx;
}

.award-card {
  overflow: hidden;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 42rpx rgba(62, 39, 27, 0.1);
}

.award-card__cover {
  height: 260rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #f9d3b3, #f6af82);
}

.award-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.88);
  color: #8a4f36;
  font-size: 22rpx;
  font-weight: 600;
}

.award-card__body {
  padding: 28rpx;
}

.award-card__title {
  font-size: 32rpx;
  font-weight: 700;
  color: #2f2018;
}

.award-card__creator,
.award-card__task,
.award-card__result {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #7f6457;
}

.award-card__action {
  margin-top: 20rpx;
  color: #ff6f3c;
  font-size: 24rpx;
  font-weight: 600;
}
```

```js
// apps/wechat-miniapp/miniprogram/pages/profile/index.js
import { setAppRole } from "../../../src/services/role.js";
import { buildProfileModel } from "../../../src/view-models/workspace.js";

Page({
  data: {
    title: "",
    creatorName: "",
    creatorBio: "",
    creatorTags: [],
    creatorStatus: "",
    stats: [],
    quickLinks: [],
    merchantEntry: null
  },

  onShow() {
    const model = buildProfileModel(getApp().globalData.activeRole || "creator");

    this.setData({
      title: model.title,
      creatorName: model.creatorName,
      creatorBio: model.creatorBio,
      creatorTags: model.creatorTags,
      creatorStatus: model.creatorStatus,
      stats: model.stats,
      quickLinks: model.quickLinks,
      merchantEntry: model.merchantEntry
    });
  },

  onQuickLinkTap(event) {
    const { path } = event.currentTarget.dataset;

    if (!path) {
      return;
    }

    wx.navigateTo({ url: path });
  },

  onMerchantEntryTap() {
    setAppRole("merchant");
    wx.navigateTo({ url: "/pages/merchant/task-create/index" });
  }
});
```

```xml
<!-- apps/wechat-miniapp/miniprogram/pages/profile/index.wxml -->
<view class="page-shell page-shell--warm">
  <view class="profile-hero">
    <view class="profile-hero__name">{{creatorName}}</view>
    <view class="profile-hero__bio">{{creatorBio}}</view>
    <view class="profile-hero__status">{{creatorStatus}}</view>

    <view class="profile-hero__tags">
      <view wx:for="{{creatorTags}}" wx:key="*this" class="profile-tag">
        {{item}}
      </view>
    </view>
  </view>

  <view class="stats-card">
    <view wx:for="{{stats}}" wx:key="label" class="stats-card__item">
      <view class="stats-card__value">{{item.value}}</view>
      <view class="stats-card__label">{{item.label}}</view>
    </view>
  </view>

  <view class="quick-link-list">
    <view
      wx:for="{{quickLinks}}"
      wx:key="title"
      class="quick-link"
      data-path="{{item.path}}"
      bind:tap="onQuickLinkTap"
    >
      <view class="quick-link__title">{{item.title}}</view>
      <view class="quick-link__arrow">查看</view>
    </view>
  </view>

  <view class="merchant-card" bind:tap="onMerchantEntryTap">
    <view class="merchant-card__title">{{merchantEntry.title}}</view>
    <view class="merchant-card__desc">{{merchantEntry.description}}</view>
    <view class="merchant-card__action">{{merchantEntry.actionText}}</view>
  </view>
</view>
```

```css
/* apps/wechat-miniapp/miniprogram/pages/profile/index.wxss */
.profile-hero {
  padding: 36rpx 32rpx;
  border-radius: 36rpx;
  background: linear-gradient(135deg, #fff1e4, #ffe7d0);
  box-shadow: 0 16rpx 36rpx rgba(203, 116, 71, 0.14);
}

.profile-hero__name {
  font-size: 42rpx;
  font-weight: 700;
  color: #2f2018;
}

.profile-hero__bio,
.profile-hero__status {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #7d6256;
}

.profile-hero__tags {
  display: flex;
  gap: 14rpx;
  flex-wrap: wrap;
  margin-top: 20rpx;
}

.profile-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #9a5f46;
  font-size: 22rpx;
  font-weight: 600;
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 42rpx rgba(62, 39, 27, 0.1);
}

.stats-card__item {
  padding: 12rpx 0;
}

.stats-card__value {
  font-size: 34rpx;
  font-weight: 700;
  color: #2f2018;
}

.stats-card__label {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8c6f62;
}

.quick-link-list {
  display: grid;
  gap: 18rpx;
  margin-top: 24rpx;
}

.quick-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 26rpx 28rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 14rpx 32rpx rgba(62, 39, 27, 0.08);
}

.quick-link__title {
  font-size: 28rpx;
  font-weight: 600;
  color: #2f2018;
}

.quick-link__arrow {
  font-size: 22rpx;
  color: #ff6f3c;
  font-weight: 600;
}

.merchant-card {
  margin-top: 28rpx;
  padding: 30rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #fff8f0, #ffe9d7);
  box-shadow: 0 16rpx 36rpx rgba(205, 118, 73, 0.12);
}

.merchant-card__title {
  font-size: 30rpx;
  font-weight: 700;
  color: #2f2018;
}

.merchant-card__desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #84675a;
}

.merchant-card__action {
  margin-top: 18rpx;
  color: #ff6f3c;
  font-size: 24rpx;
  font-weight: 600;
}
```

```js
// apps/wechat-miniapp/miniprogram/pages/wallet/index.js
import { getWalletSnapshot } from "../../../src/services/wallet.js";
import { buildEarningsModel } from "../../../src/view-models/earnings.js";
import { buildWalletEntryModel } from "../../../src/view-models/workspace.js";

Page({
  data: {
    title: "",
    summary: "",
    cards: [],
    error: ""
  },

  async onShow() {
    const copy = buildWalletEntryModel();

    try {
      const snapshot = await getWalletSnapshot("creator");
      const model = buildEarningsModel(snapshot);

      this.setData({
        title: copy.title,
        summary: copy.summary,
        cards: model.cards,
        error: ""
      });
    } catch (error) {
      this.setData({
        title: copy.title,
        summary: copy.summary,
        cards: [],
        error: error.message || "收益明细加载失败"
      });
    }
  }
});
```

```xml
<!-- apps/wechat-miniapp/miniprogram/pages/wallet/index.wxml -->
<view class="page-shell page-shell--warm">
  <view class="card card--soft">
    <view class="page-title">{{title}}</view>
    <view class="page-subtitle">{{summary}}</view>
  </view>

  <view wx:if="{{cards.length}}" class="page-section list-card">
    <view wx:for="{{cards}}" wx:key="label" class="list-card__row">
      <view class="list-card__title">{{item.label}}</view>
      <view class="pill">{{item.value}}</view>
    </view>
  </view>

  <view wx:elif="{{error}}" class="native-empty">
    {{error}}
  </view>
</view>
```

```css
/* apps/wechat-miniapp/miniprogram/app.wxss */
page {
  min-height: 100%;
  background: #fff6ee;
  color: #2f2018;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.page-shell {
  min-height: 100vh;
  padding: 32rpx;
}

.card {
  padding: 28rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 42rpx rgba(62, 39, 27, 0.1);
}

.card--soft {
  background: linear-gradient(135deg, #fff2e7, #ffead8);
}

.page-section {
  display: grid;
  gap: 20rpx;
  margin-top: 24rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #2f2018;
}

.page-subtitle {
  margin-top: 12rpx;
  color: #84675a;
  font-size: 26rpx;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: #fff0e7;
  color: #ff6f3c;
  font-size: 22rpx;
  font-weight: 600;
}

.list-card {
  display: grid;
  gap: 16rpx;
}

.list-card__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 32rpx rgba(62, 39, 27, 0.08);
}

.list-card__title {
  font-size: 30rpx;
  font-weight: 600;
  color: #2f2018;
}

.list-card__meta {
  margin-top: 8rpx;
  color: #84675a;
  font-size: 24rpx;
}

.native-empty {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  background: #ffffff;
  color: #84675a;
  text-align: center;
  box-shadow: 0 12rpx 32rpx rgba(62, 39, 27, 0.06);
}
```

- [ ] **Step 4: Run the mini program test suite and build check**

Run:

```bash
pnpm --filter @meow/wechat-miniapp test -- workspace.test.js task-feed.test.js project-config.test.js task-detail.test.js community-pages.test.js
pnpm --filter @meow/wechat-miniapp build
```

Expected:

- First command: PASS with all listed test files green
- Second command: exits 0 from `node ./scripts/check-js.mjs`

- [ ] **Step 5: Verify the shell manually in WeChat DevTools**

Run:

```bash
pnpm --filter @meow/wechat-miniapp dev
```

Expected terminal output: `Use WeChat DevTools to run apps/wechat-miniapp/miniprogram`

Then inspect in DevTools:

- `悬赏大厅` first screen shows hero + channel chips + content cards, not a utility list
- `获奖作品` first screen shows banner + two filter rows + showcase cards
- `我的` first screen looks like a creator profile and the merchant entry is only a lower card
- `收益明细` is reachable from `我的`, but is not a tab
- Merchant publish flow is still reachable through `商家合作 -> 进入商家侧`

- [ ] **Step 6: Commit the community page wiring**

```bash
git add apps/wechat-miniapp/src/tests/community-pages.test.js apps/wechat-miniapp/miniprogram/pages/workspace/index.js apps/wechat-miniapp/miniprogram/pages/workspace/index.wxml apps/wechat-miniapp/miniprogram/pages/workspace/index.wxss apps/wechat-miniapp/miniprogram/pages/profile/index.js apps/wechat-miniapp/miniprogram/pages/profile/index.wxml apps/wechat-miniapp/miniprogram/pages/profile/index.wxss apps/wechat-miniapp/miniprogram/pages/wallet/index.js apps/wechat-miniapp/miniprogram/pages/wallet/index.wxml apps/wechat-miniapp/miniprogram/app.wxss
git commit -m "feat: turn shell pages into creator community views"
```

## Self-Review Checklist

- Spec coverage:
  - IA and tab changes are covered in Task 1.
  - `悬赏大厅` channels, hero, and task cards are covered in Task 2.
  - `获奖作品`, `我的`, `商家合作` card, and wallet secondary entry are covered in Task 3.
  - Global style shift from utility UI to community cards is covered in Task 3.
- Placeholder scan:
  - No `TBD`, `TODO`, or “similar to previous task” shortcuts remain.
- Type consistency:
  - Top-level model names stay consistent: `buildLobbyModel`, `buildAwardsModel`, `buildProfileModel`, `buildWalletEntryModel`, `mapTaskCard`.

import { describe, expect, it } from "vitest";
import { createRoleService } from "../services/role.js";
import {
  buildAwardsModel,
  buildLobbyModel,
  buildProfileModel,
  getTabBarItems
} from "../view-models/workspace.js";

describe("mini program role service", () => {
  it("loads the current session and switches between creator and merchant", async () => {
    const api = {
      getSession: async () => ({
        user: { id: "user-1" },
        activeRole: "creator",
        roles: ["creator", "merchant"]
      }),
      switchRole: async (role) => ({
        user: { id: "user-1" },
        activeRole: role,
        roles: ["creator", "merchant"]
      })
    };

    const service = createRoleService(api);

    expect(await service.loadSession()).toMatchObject({ activeRole: "creator" });
    expect(await service.switchRole("merchant")).toMatchObject({
      activeRole: "merchant"
    });
  });
});

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

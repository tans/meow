import { describe, expect, it } from "vitest";
import {
  buildWorkspaceModel,
  getTabBarItems
} from "../view-models/workspace.js";

describe("native workspace model", () => {
  it("returns native tab bar items for the shared mini program", () => {
    expect(getTabBarItems()).toEqual([
      { text: "工作台", pagePath: "pages/workspace/index" },
      { text: "任务", pagePath: "pages/tasks/index" },
      { text: "收益", pagePath: "pages/wallet/index" },
      { text: "我的", pagePath: "pages/profile/index" }
    ]);
  });

  it("builds role-specific workspace sections without a shell page", () => {
    expect(buildWorkspaceModel("merchant")).toMatchObject({
      title: "商家工作台",
      primaryAction: "发布任务"
    });
    expect(buildWorkspaceModel("creator")).toMatchObject({
      title: "创作者工作台",
      primaryAction: "浏览任务池"
    });
  });
});

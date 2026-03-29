import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "pages");
const projectRoot = path.resolve(process.cwd(), "..", "..");

const readPageFile = (pagePath) => readFileSync(path.join(root, pagePath), "utf8");
const readProjectFile = (relativePath) =>
  readFileSync(path.join(projectRoot, relativePath), "utf8");

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

  it("documents root runtime as the only active shell source of truth", () => {
    const source = readProjectFile(
      "docs/superpowers/plans/2026-03-29-creator-community-shell-closeout.md"
    );

    expect(source).toContain("apps/wechat-miniapp");
    expect(source).toContain("唯一执行面");
    expect(source).toContain("miniprogram/**");
    expect(source).toContain("未纳入本轮");
  });

  it("points local dev instructions at the root runtime", () => {
    const source = readProjectFile("apps/wechat-miniapp/package.json");

    expect(source).toContain("Use WeChat DevTools to run apps/wechat-miniapp");
    expect(source).not.toContain("Use WeChat DevTools to run apps/wechat-miniapp/miniprogram");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreatorHomePage } from "../routes/CreatorHomePage.js";
import { MerchantTaskDetailPage } from "../routes/MerchantTaskDetailPage.js";
import { MerchantTasksPage } from "../routes/MerchantTasksPage.js";

describe("creator home page", () => {
  it("renders miniapp lobby copy and task cards", () => {
    render(
      <CreatorHomePage
        channels={["推荐", "品牌合作", "急单", "同城"]}
        activeChannel="推荐"
        tasks={[
          {
            id: "task-1",
            title: "春季穿搭口播征稿",
            brandName: "奈雪",
            summary: "到店拍摄 15 秒短视频",
            rewardText: "基础奖 1 x 2 + 排名奖 1",
            metaText: "126 人参与 · 距截止 3 天",
            highlightTag: "平台精选"
          }
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "悬赏大厅" })).toBeTruthy();
    expect(screen.getByText("推荐")).toBeTruthy();
    expect(screen.getByText("平台精选")).toBeTruthy();
  });

  it("renders merchant task management cards", () => {
    render(
      <MerchantTasksPage
        tasks={[
          {
            id: "task-1",
            title: "春季穿搭口播征稿",
            submissionCount: 18,
            statusText: "审核中"
          }
        ]}
      />
    );

    expect(screen.getByText("任务管理")).toBeTruthy();
    expect(screen.getByText("审核中")).toBeTruthy();
    expect(screen.getByText("18 件投稿")).toBeTruthy();
    expect(screen.getByRole("button", { name: "查看详情" })).toBeTruthy();
  });

  it("renders merchant task detail actions", () => {
    render(
      <MerchantTaskDetailPage
        task={{
          id: "task-1",
          title: "春季穿搭口播征稿",
          statusText: "征集中",
          rewardText: "基础奖 1 x 2 + 排名奖 1",
          submissionCount: 18,
          lockedBudgetText: "¥3",
          rewardTags: ["base", "tip"]
        }}
      />
    );

    expect(screen.getByRole("button", { name: "前往审核" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "前往结算" })).toBeTruthy();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreatorHomePage } from "../routes/CreatorHomePage.js";
import { MerchantTasksPage } from "../routes/MerchantTasksPage.js";

describe("creator home page", () => {
  it("renders community-first task cards from api data", () => {
    render(
      <CreatorHomePage
        tasks={[
          {
            id: "task-1",
            title: "春季穿搭口播征稿",
            brandName: "Demo Brand",
            budgetText: "¥300",
            deadlineText: "3 天后截止"
          }
        ]}
      />
    );

    expect(screen.getByText("春季穿搭口播征稿")).toBeTruthy();
    expect(screen.getByText("Demo Brand")).toBeTruthy();
    expect(screen.getByText("¥300")).toBeTruthy();
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
  });
});

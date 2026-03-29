import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App, { type WebSession } from "../App.js";

afterEach(() => {
  cleanup();
});

describe("App shell contract", () => {
  it("renders login page when no session exists", () => {
    render(<App />);

    expect(screen.getByText("登录创意喵")).toBeTruthy();
  });

  it("renders creator navigation for creator role", () => {
    const creatorSession: WebSession = {
      role: "creator",
      userId: "creator-1"
    };

    render(<App session={creatorSession} />);

    expect(screen.getByText("悬赏大厅")).toBeTruthy();
    expect(screen.getByText("获奖作品")).toBeTruthy();
    expect(screen.getByText("我的")).toBeTruthy();
  });

  it("renders merchant navigation for merchant role", () => {
    const merchantSession: WebSession = {
      role: "merchant",
      userId: "merchant-1"
    };

    render(<App session={merchantSession} />);

    expect(screen.getByText("任务管理")).toBeTruthy();
    expect(screen.getByText("发布任务")).toBeTruthy();
    expect(screen.getByText("稿件审核")).toBeTruthy();
    expect(screen.getByText("我的")).toBeTruthy();
  });
});

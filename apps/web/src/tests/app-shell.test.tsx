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
      user: {
        id: "creator-1",
        displayName: "Demo Creator"
      },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    };

    render(<App session={creatorSession} />);

    expect(
      screen.getByRole("navigation", { name: "User navigation" })
    ).toBeTruthy();
    expect(screen.getByText("获奖作品")).toBeTruthy();
    expect(screen.getByText("我的")).toBeTruthy();
  });

  it("renders merchant navigation for merchant role", () => {
    const merchantSession: WebSession = {
      user: {
        id: "merchant-1",
        displayName: "Demo Merchant"
      },
      activeRole: "merchant",
      roles: ["merchant", "creator"]
    };

    render(<App session={merchantSession} />);

    expect(
      screen.getByRole("navigation", { name: "User navigation" })
    ).toBeTruthy();
    expect(screen.getByText("发布任务")).toBeTruthy();
    expect(screen.getByText("稿件审核")).toBeTruthy();
    expect(screen.getByText("我的")).toBeTruthy();
  });
});

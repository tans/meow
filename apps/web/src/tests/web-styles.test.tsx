import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App, { type WebSession } from "../App.js";
import { LoginPage } from "../routes/LoginPage.js";

describe("web visual structure", () => {
  it("renders the login surface with branded layout classes", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <LoginPage loading={false} onSubmit={onSubmit} />
    );

    expect(container.firstElementChild?.classList.contains("login-screen")).toBe(true);
    expect(
      screen
        .getByRole("heading", { name: "登录创意喵" })
        .classList.contains("login-title")
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "进入创意喵" })
        .classList.contains("primary-button")
    ).toBe(true);
  });

  it("renders the authenticated shell with mobile layout classes", () => {
    const session: WebSession = {
      user: {
        id: "hybrid-1",
        displayName: "Demo Hybrid"
      },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    };

    const { container } = render(<App session={session} />);

    expect(container.firstElementChild?.classList.contains("mobile-app")).toBe(true);
    expect(
      screen
        .getByRole("navigation", { name: "Creator tabs" })
        .classList.contains("bottom-tab-bar")
    ).toBe(true);
    expect(
      screen
        .getByRole("heading", { name: "悬赏大厅" })
        .closest("section")
        ?.classList.contains("content-section")
    ).toBe(true);
  });
});

import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App, { type WebSession } from "../App.js";

const creatorSession: WebSession = {
  user: { id: "hybrid-1", displayName: "Demo Hybrid" },
  activeRole: "creator",
  roles: ["creator", "merchant"]
};

afterEach(() => cleanup());

describe("web routing", () => {
  it("redirects creator root to the miniapp tasks tab", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App session={creatorSession} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "悬赏大厅" })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "悬赏大厅" })
        .getAttribute("aria-current")
    ).toBe("page");
  });

  it("shows login when no session exists", () => {
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "登录创意喵" })).toBeTruthy();
  });

  it("moves a merchant session to the merchant entry route", () => {
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App
          session={{
            user: { id: "merchant-1", displayName: "Demo Merchant" },
            activeRole: "merchant",
            roles: ["merchant", "creator"]
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "发布任务" })).toBeTruthy();
  });
});

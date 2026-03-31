import { MemoryRouter } from "react-router-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App, { type WebSession } from "../App.js";

const apiMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  listCreatorTasks: vi.fn(async () => []),
  listMerchantTasks: vi.fn(async () => []),
  login: vi.fn(),
  switchRole: vi.fn()
}));

vi.mock("../lib/api.js", () => apiMocks);

afterEach(() => {
  cleanup();
  apiMocks.switchRole.mockReset();
});

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe("App shell contract", () => {
  it("renders creator tabs inside the mobile shell", () => {
    const creatorSession: WebSession = {
      user: {
        id: "creator-1",
        displayName: "Demo Creator"
      },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    };

    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App session={creatorSession} />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("navigation", { name: "Creator tabs" })
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "悬赏大厅" })).toBeTruthy();
    expect(screen.getByText("Demo Creator")).toBeTruthy();
  });

  it("switches role and redirects to merchant entry route", async () => {
    const creatorSession: WebSession = {
      user: {
        id: "creator-1",
        displayName: "Demo Creator"
      },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    };

    apiMocks.switchRole.mockResolvedValue({
      sessionId: "session-1",
      userId: "creator-1",
      activeRole: "merchant",
      roles: ["creator", "merchant"]
    });

    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App session={creatorSession} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "切换到商家" }));

    expect(apiMocks.switchRole).toHaveBeenCalledWith("merchant");
    expect(await screen.findByRole("heading", { name: "发布任务" })).toBeTruthy();
  });

  it("shows loading feedback while switching role and hides the switch control", async () => {
    const creatorSession: WebSession = {
      user: {
        id: "creator-1",
        displayName: "Demo Creator"
      },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    };

    const deferred = createDeferred<{
      sessionId: string;
      userId: string;
      activeRole: "merchant";
      roles: ["creator", "merchant"];
    }>();

    apiMocks.switchRole.mockReturnValue(deferred.promise);

    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App session={creatorSession} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "切换到商家" }));

    expect(screen.queryByRole("button", { name: "切换到商家" })).toBeNull();
    expect(screen.getByText("正在同步角色视图...")).toBeTruthy();

    deferred.resolve({
      sessionId: "session-1",
      userId: "creator-1",
      activeRole: "merchant",
      roles: ["creator", "merchant"]
    });

    expect(await screen.findByRole("heading", { name: "发布任务" })).toBeTruthy();
  });

  it("shows authenticated error feedback when role switching fails", async () => {
    const creatorSession: WebSession = {
      user: {
        id: "creator-1",
        displayName: "Demo Creator"
      },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    };

    apiMocks.switchRole.mockRejectedValue(new Error("switch failed"));

    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App session={creatorSession} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "切换到商家" }));

    expect(
      await screen.findByText("角色切换失败，请稍后重试。")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "切换到商家" })).toBeTruthy();
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App.js";

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });

const toUrl = (input: RequestInfo | URL) =>
  new URL(
    typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
    "http://localhost"
  );

const respondToOperatorBootstrap = (
  url: URL,
  method: string,
  sessionState: { calls: number }
) => {
  if (url.pathname === "/api/auth/session") {
    sessionState.calls += 1;
    return sessionState.calls === 1
      ? new Response(null, { status: 401 })
      : createJsonResponse({
          userId: "operator-1",
          activeRole: "operator",
          roles: ["operator"]
        });
  }

  if (url.pathname === "/api/auth/login" && method === "POST") {
    return createJsonResponse({ ok: true });
  }

  return null;
};

describe("Admin app real api wiring", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads task, user, settings pages from admin apis after login", async () => {
    const sessionState = { calls: 0 };

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = toUrl(input);
        const method = init?.method ?? "GET";
        const bootstrapResponse = respondToOperatorBootstrap(url, method, sessionState);
        if (bootstrapResponse) {
          return bootstrapResponse;
        }

        if (url.pathname === "/api/admin/dashboard") {
          return createJsonResponse({
            title: "真实后台概览",
            summary: "来自真实接口",
            metrics: [{ label: "待处理任务", value: "2", trend: "较昨日 +1" }],
            alerts: []
          });
        }

        if (url.pathname === "/api/admin/ledger") {
          return createJsonResponse([
            {
              id: "operator-action-1",
              action: "pause-task",
              targetId: "task-live-1",
              targetType: "task",
              operatorId: "operator-1",
              reason: "人工复核"
            }
          ]);
        }

        if (url.pathname === "/api/admin/tasks") {
          expect(url.searchParams.get("page")).toBe("1");
          expect(url.searchParams.get("pageSize")).toBe("20");
          return createJsonResponse({
            items: [
              {
                id: "task-live-1",
                title: "真实任务池",
                merchantId: "merchant-1",
                status: "paused",
                submissionCount: 3,
                escrowLockedAmount: 88,
                updatedAt: "2026-04-04T00:00:00.000Z"
              }
            ],
            pagination: { page: 1, pageSize: 20, total: 1 }
          });
        }

        if (url.pathname === "/api/admin/users") {
          expect(url.searchParams.get("page")).toBe("1");
          expect(url.searchParams.get("pageSize")).toBe("20");
          return createJsonResponse({
            items: [
              {
                id: "creator-live-1",
                identifier: "creator@example.com",
                displayName: "真实创作者",
                roles: ["creator"],
                state: "active"
              }
            ],
            pagination: { page: 1, pageSize: 20, total: 1 }
          });
        }

        if (url.pathname === "/api/admin/settings") {
          return createJsonResponse({
            allowTaskPublish: false,
            enableTipReward: true,
            dailyTaskRewardCap: 456
          });
        }

        throw new Error(`unhandled fetch: ${method} ${url.pathname}${url.search}`);
      })
    );

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "进入后台" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "真实后台概览" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /任务管理/ }));
    await waitFor(() => {
      expect(screen.getByText("真实任务池")).toBeInTheDocument();
      expect(screen.getByText("第 1 / 1 页 · 共 1 条")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /用户管理/ }));
    await waitFor(() => {
      expect(screen.getByText("真实创作者")).toBeInTheDocument();
      expect(screen.getByText("第 1 / 1 页 · 共 1 条")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /系统设置/ }));
    await waitFor(() => {
      expect(screen.getByLabelText("允许新任务发布")).toBeInTheDocument();
      expect(screen.getByDisplayValue("456")).toBeInTheDocument();
    });
  });

  it("exposes resume, ban, anomaly and settings-save actions", async () => {
    const sessionState = { calls: 0 };

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = toUrl(input);
        const method = init?.method ?? "GET";
        const bootstrapResponse = respondToOperatorBootstrap(url, method, sessionState);
        if (bootstrapResponse) {
          return bootstrapResponse;
        }

        if (url.pathname === "/api/admin/dashboard") {
          return createJsonResponse({
            title: "动作联调起始页",
            summary: "ok",
            metrics: [],
            alerts: []
          });
        }

        if (url.pathname === "/api/admin/ledger") {
          return createJsonResponse([
            {
              id: "ledger-1",
              action: "pause-task",
              targetId: "task-live-1",
              targetType: "task",
              operatorId: "operator-1",
              reason: "人工复核"
            }
          ]);
        }

        if (url.pathname === "/api/admin/tasks") {
          return createJsonResponse({
            items: [
              {
                id: "task-live-1",
                title: "真实任务池",
                merchantId: "merchant-1",
                status: "paused",
                submissionCount: 3,
                escrowLockedAmount: 88,
                updatedAt: "2026-04-04T00:00:00.000Z"
              }
            ],
            pagination: { page: 1, pageSize: 20, total: 1 }
          });
        }

        if (url.pathname === "/api/admin/tasks/task-live-1") {
          return createJsonResponse({
            id: "task-live-1",
            title: "真实任务池",
            merchantId: "merchant-1",
            status: "paused",
            escrowLockedAmount: 88,
            submissionStats: { total: 3, approved: 1, pending: 2 },
            governanceActions: []
          });
        }

        if (url.pathname === "/api/admin/users") {
          return createJsonResponse({
            items: [
              {
                id: "creator-live-1",
                identifier: "creator@example.com",
                displayName: "真实创作者",
                roles: ["creator"],
                state: "active"
              }
            ],
            pagination: { page: 1, pageSize: 20, total: 1 }
          });
        }

        if (url.pathname === "/api/admin/settings") {
          return createJsonResponse({
            allowTaskPublish: true,
            enableTipReward: true,
            dailyTaskRewardCap: 100
          });
        }

        if (
          url.pathname === "/api/admin/tasks/task-live-1/resume" ||
          url.pathname === "/api/admin/users/creator-live-1/ban" ||
          url.pathname === "/api/admin/ledger/ledger-1/mark-anomaly" ||
          (url.pathname === "/api/admin/settings" && method === "PUT")
        ) {
          return createJsonResponse({ ok: true });
        }

        throw new Error(`unhandled fetch: ${method} ${url.pathname}${url.search}`);
      })
    );

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "进入后台" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "动作联调起始页" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /任务管理/ }));
    await waitFor(() => {
      expect(screen.getByText("真实任务池")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "查看详情" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "恢复任务" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /用户管理/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "封禁用户" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /资金管理/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "标记异常" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /系统设置/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "保存设置" })).toBeInTheDocument();
    });
  });

  it("supports task query controls and pagination against admin apis", async () => {
    const sessionState = { calls: 0 };
    const taskRequests: URL[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = toUrl(input);
        const method = init?.method ?? "GET";
        const bootstrapResponse = respondToOperatorBootstrap(url, method, sessionState);
        if (bootstrapResponse) {
          return bootstrapResponse;
        }

        if (url.pathname === "/api/admin/dashboard") {
          return createJsonResponse({
            title: "任务查询后台",
            summary: "ok",
            metrics: [],
            alerts: []
          });
        }

        if (url.pathname === "/api/admin/ledger") {
          return createJsonResponse([]);
        }

        if (url.pathname === "/api/admin/tasks") {
          taskRequests.push(url);

          if (url.searchParams.get("page") === "2") {
            return createJsonResponse({
              items: [
                {
                  id: "task-page-2",
                  title: "第二页任务",
                  merchantId: "merchant-2",
                  status: "paused",
                  submissionCount: 1,
                  escrowLockedAmount: 66,
                  updatedAt: "2026-04-04T00:00:00.000Z"
                }
              ],
              pagination: { page: 2, pageSize: 20, total: 21 }
            });
          }

          return createJsonResponse({
            items: [
              {
                id: "task-filtered-1",
                title: "筛选后的任务",
                merchantId: "merchant-1",
                status: "published",
                submissionCount: 5,
                escrowLockedAmount: 88,
                updatedAt: "2026-04-04T00:00:00.000Z"
              }
            ],
            pagination: { page: 1, pageSize: 20, total: 21 }
          });
        }

        if (url.pathname === "/api/admin/users") {
          return createJsonResponse({
            items: [],
            pagination: { page: 1, pageSize: 20, total: 0 }
          });
        }

        if (url.pathname === "/api/admin/settings") {
          return createJsonResponse({
            allowTaskPublish: true,
            enableTipReward: true,
            dailyTaskRewardCap: 100
          });
        }

        throw new Error(`unhandled fetch: ${method} ${url.pathname}${url.search}`);
      })
    );

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "进入后台" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "任务查询后台" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /任务管理/ }));
    await waitFor(() => {
      expect(screen.getByText("筛选后的任务")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("任务关键字"), { target: { value: "任务池" } });
    fireEvent.change(screen.getByLabelText("任务状态"), { target: { value: "published" } });
    fireEvent.click(screen.getByRole("button", { name: "应用任务筛选" }));

    await waitFor(() => {
      const request = taskRequests.at(-1);
      expect(request?.searchParams.get("page")).toBe("1");
      expect(request?.searchParams.get("pageSize")).toBe("20");
      expect(request?.searchParams.get("status")).toBe("published");
      expect(request?.searchParams.get("keyword")).toBe("任务池");
    });

    expect(screen.getByText("第 1 / 2 页 · 共 21 条")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一页任务" }));

    await waitFor(() => {
      const request = taskRequests.at(-1);
      expect(request?.searchParams.get("page")).toBe("2");
      expect(request?.searchParams.get("status")).toBe("published");
      expect(request?.searchParams.get("keyword")).toBe("任务池");
      expect(screen.getByText("第二页任务")).toBeInTheDocument();
    });
  });

  it("supports user query controls and pagination against admin apis", async () => {
    const sessionState = { calls: 0 };
    const userRequests: URL[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = toUrl(input);
        const method = init?.method ?? "GET";
        const bootstrapResponse = respondToOperatorBootstrap(url, method, sessionState);
        if (bootstrapResponse) {
          return bootstrapResponse;
        }

        if (url.pathname === "/api/admin/dashboard") {
          return createJsonResponse({
            title: "用户查询后台",
            summary: "ok",
            metrics: [],
            alerts: []
          });
        }

        if (url.pathname === "/api/admin/ledger") {
          return createJsonResponse([]);
        }

        if (url.pathname === "/api/admin/tasks") {
          return createJsonResponse({
            items: [],
            pagination: { page: 1, pageSize: 20, total: 0 }
          });
        }

        if (url.pathname === "/api/admin/users") {
          userRequests.push(url);

          if (url.searchParams.get("page") === "2") {
            return createJsonResponse({
              items: [
                {
                  id: "creator-page-2",
                  identifier: "page2@example.com",
                  displayName: "第二页创作者",
                  roles: ["creator"],
                  state: "active"
                }
              ],
              pagination: { page: 2, pageSize: 20, total: 21 }
            });
          }

          return createJsonResponse({
            items: [
              {
                id: "merchant-filtered-1",
                identifier: "merchant@example.com",
                displayName: "筛选商家",
                roles: ["merchant"],
                state: "banned"
              }
            ],
            pagination: { page: 1, pageSize: 20, total: 21 }
          });
        }

        if (url.pathname === "/api/admin/settings") {
          return createJsonResponse({
            allowTaskPublish: true,
            enableTipReward: true,
            dailyTaskRewardCap: 100
          });
        }

        throw new Error(`unhandled fetch: ${method} ${url.pathname}${url.search}`);
      })
    );

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "进入后台" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "用户查询后台" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /用户管理/ }));
    await waitFor(() => {
      expect(screen.getByText("筛选商家")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("用户关键字"), { target: { value: "merchant" } });
    fireEvent.change(screen.getByLabelText("用户角色"), { target: { value: "merchant" } });
    fireEvent.change(screen.getByLabelText("用户状态"), { target: { value: "banned" } });
    fireEvent.click(screen.getByRole("button", { name: "应用用户筛选" }));

    await waitFor(() => {
      const request = userRequests.at(-1);
      expect(request?.searchParams.get("page")).toBe("1");
      expect(request?.searchParams.get("pageSize")).toBe("20");
      expect(request?.searchParams.get("state")).toBe("banned");
      expect(request?.searchParams.get("role")).toBe("merchant");
      expect(request?.searchParams.get("keyword")).toBe("merchant");
    });

    expect(screen.getByText("第 1 / 2 页 · 共 21 条")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一页用户" }));

    await waitFor(() => {
      const request = userRequests.at(-1);
      expect(request?.searchParams.get("page")).toBe("2");
      expect(request?.searchParams.get("state")).toBe("banned");
      expect(request?.searchParams.get("role")).toBe("merchant");
      expect(request?.searchParams.get("keyword")).toBe("merchant");
      expect(screen.getByText("第二页创作者")).toBeInTheDocument();
    });
  });
});

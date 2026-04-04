import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import App from "../App.js";

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });

describe("Admin app real api wiring", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads task, user, settings pages from admin apis after login", async () => {
    let sessionCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
        const method = init?.method ?? "GET";

        if (url === "/api/auth/session") {
          sessionCalls += 1;
          return sessionCalls === 1
            ? new Response(null, { status: 401 })
            : createJsonResponse({
                userId: "operator-1",
                activeRole: "operator",
                roles: ["operator"]
              });
        }

        if (url === "/api/auth/login" && method === "POST") {
          return createJsonResponse({ ok: true });
        }

        if (url === "/api/admin/dashboard") {
          return createJsonResponse({
            title: "真实后台概览",
            summary: "来自真实接口",
            metrics: [{ label: "待处理任务", value: "2", trend: "较昨日 +1" }],
            alerts: []
          });
        }

        if (url === "/api/admin/ledger") {
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

        if (url === "/api/admin/tasks") {
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

        if (url === "/api/admin/users") {
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

        if (url === "/api/admin/settings") {
          return createJsonResponse({
            allowTaskPublish: false,
            enableTipReward: true,
            dailyTaskRewardCap: 456
          });
        }

        throw new Error(`unhandled fetch: ${method} ${url}`);
      })
    );

    render(<App />);

    (await screen.findByRole("button", { name: "进入后台" })).click();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "真实后台概览" })).toBeInTheDocument();
    });

    screen.getByRole("button", { name: /任务管理/ }).click();
    await waitFor(() => {
      expect(screen.getByText("真实任务池")).toBeInTheDocument();
    });

    screen.getByRole("button", { name: /用户管理/ }).click();
    await waitFor(() => {
      expect(screen.getByText("真实创作者")).toBeInTheDocument();
    });

    screen.getByRole("button", { name: /系统设置/ }).click();
    await waitFor(() => {
      expect(screen.getByLabelText("允许新任务发布")).toBeInTheDocument();
      expect(screen.getByDisplayValue("456")).toBeInTheDocument();
    });
  });

  it("exposes resume, ban, anomaly and settings-save actions", async () => {
    let sessionCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
        const method = init?.method ?? "GET";

        if (url === "/api/auth/session") {
          sessionCalls += 1;
          return sessionCalls === 1
            ? new Response(null, { status: 401 })
            : createJsonResponse({
                userId: "operator-1",
                activeRole: "operator",
                roles: ["operator"]
              });
        }

        if (url === "/api/auth/login" && method === "POST") {
          return createJsonResponse({ ok: true });
        }

        if (url === "/api/admin/dashboard") {
          return createJsonResponse({
            title: "动作联调起始页",
            summary: "ok",
            metrics: [],
            alerts: []
          });
        }

        if (url === "/api/admin/ledger") {
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

        if (url === "/api/admin/tasks") {
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

        if (url === "/api/admin/tasks/task-live-1") {
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

        if (url === "/api/admin/users") {
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

        if (url === "/api/admin/settings") {
          return createJsonResponse({
            allowTaskPublish: true,
            enableTipReward: true,
            dailyTaskRewardCap: 100
          });
        }

        if (
          url === "/api/admin/tasks/task-live-1/resume" ||
          url === "/api/admin/users/creator-live-1/ban" ||
          url === "/api/admin/ledger/ledger-1/mark-anomaly" ||
          (url === "/api/admin/settings" && method === "PUT")
        ) {
          return createJsonResponse({ ok: true });
        }

        throw new Error(`unhandled fetch: ${method} ${url}`);
      })
    );

    render(<App />);

    (await screen.findByRole("button", { name: "进入后台" })).click();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "动作联调起始页" })).toBeInTheDocument();
    });

    screen.getByRole("button", { name: /任务管理/ }).click();
    await waitFor(() => {
      expect(screen.getByText("真实任务池")).toBeInTheDocument();
    });
    screen.getByRole("button", { name: "查看详情" }).click();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "恢复任务" })).toBeInTheDocument();
    });

    screen.getByRole("button", { name: /用户管理/ }).click();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "封禁用户" })).toBeInTheDocument();
    });

    screen.getByRole("button", { name: /资金管理/ }).click();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "标记异常" })).toBeInTheDocument();
    });

    screen.getByRole("button", { name: /系统设置/ }).click();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "保存设置" })).toBeInTheDocument();
    });
  });
});

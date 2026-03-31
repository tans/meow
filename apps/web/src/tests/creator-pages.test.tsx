import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App, { type WebSession } from "../App.js";
import { CreatorTaskDetailPage } from "../routes/CreatorTaskDetailPage.js";
import { ProfilePage } from "../routes/ProfilePage.js";

const apiMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  listCreatorTasks: vi.fn(async () => []),
  listMerchantTasks: vi.fn(async () => []),
  login: vi.fn(),
  switchRole: vi.fn(),
  getCreatorTaskDetail: vi.fn(),
  listCreatorTaskSubmissions: vi.fn(async () => []),
  listCreatorSubmissions: vi.fn(async () => []),
  createCreatorSubmission: vi.fn(),
  updateCreatorSubmission: vi.fn(),
  withdrawCreatorSubmission: vi.fn(),
  getCreatorWallet: vi.fn(async () => ({
    creatorId: "creator-1",
    frozenAmount: 0,
    availableAmount: 0,
    submissionCount: 0
  }))
}));

vi.mock("../lib/api.js", () => apiMocks);

const creatorSession: WebSession = {
  user: { id: "creator-1", displayName: "Demo Creator" },
  activeRole: "creator",
  roles: ["creator", "merchant"]
};

afterEach(() => {
  cleanup();
  apiMocks.getSession.mockReset();
  apiMocks.listCreatorTasks.mockReset();
  apiMocks.listMerchantTasks.mockReset();
  apiMocks.login.mockReset();
  apiMocks.switchRole.mockReset();
  apiMocks.getCreatorTaskDetail.mockReset();
  apiMocks.listCreatorTaskSubmissions.mockReset();
  apiMocks.listCreatorSubmissions.mockReset();
  apiMocks.createCreatorSubmission.mockReset();
  apiMocks.updateCreatorSubmission.mockReset();
  apiMocks.withdrawCreatorSubmission.mockReset();
  apiMocks.getCreatorWallet.mockReset();
});

describe("creator pages", () => {
  it("renders the profile quick links and merchant entry", () => {
    render(<ProfilePage currentRole="creator" onEnterMerchant={vi.fn()} />);

    expect(screen.getByText("我的投稿")).toBeTruthy();
    expect(screen.getByText("收益明细")).toBeTruthy();
    expect(screen.getByRole("button", { name: "进入商家侧" })).toBeTruthy();
  });

  it("routes 草稿箱 quick link to submission editor with task id when available", async () => {
    apiMocks.getCreatorTaskDetail.mockResolvedValue({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      creatorSubmissionCount: 0
    });
    apiMocks.listCreatorTaskSubmissions.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <App
          session={creatorSession}
          initialTasks={[
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
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /草稿箱/ }));

    await waitFor(() => {
      expect(apiMocks.getCreatorTaskDetail).toHaveBeenCalledWith("task-1");
    });
  });

  it("shows explicit error for 草稿箱 when no task is available", async () => {
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <App session={creatorSession} initialTasks={[]} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /草稿箱/ }));

    expect(await screen.findByText("请先从任务池选择任务。")).toBeTruthy();
    expect(apiMocks.getCreatorTaskDetail).not.toHaveBeenCalled();
  });

  it("renders task detail actions and my submissions", () => {
    render(
      <MemoryRouter initialEntries={["/creator/task/task-1"]}>
        <Routes>
          <Route
            path="/creator/task/:taskId"
            element={
              <CreatorTaskDetailPage
                task={{
                  id: "task-1",
                  title: "春季短视频征稿",
                  status: "published",
                  rewardText: "基础奖 1 x 2 + 排名奖 1",
                  creatorSubmissionCount: 1,
                  canSubmit: true
                }}
                submissionCards={[
                  {
                    submissionId: "submission-1",
                    taskId: "task-1",
                    title: "第一版作品",
                    statusText: "待审核",
                    rewardTag: "待审核",
                    canEdit: true,
                    canWithdraw: true
                  }
                ]}
                onSubmitTap={vi.fn()}
                onEditTap={vi.fn()}
                onWithdrawTap={vi.fn()}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "立即投稿" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "修改" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "撤回" })).toBeTruthy();
  });

  it("blocks update when submission id is missing from task submissions", async () => {
    apiMocks.getCreatorTaskDetail.mockResolvedValue({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      creatorSubmissionCount: 0
    });
    apiMocks.listCreatorTaskSubmissions.mockResolvedValue([]);
    apiMocks.updateCreatorSubmission.mockResolvedValue({
      id: "submission-404",
      taskId: "task-1",
      creatorId: "creator-1",
      assetUrl: "https://example.com/demo.mp4",
      description: "原生小程序投稿示例",
      status: "submitted"
    });

    render(
      <MemoryRouter
        initialEntries={["/creator/submission-edit?taskId=task-1&submissionId=submission-404"]}
      >
        <App session={creatorSession} />
      </MemoryRouter>
    );

    expect(await screen.findByText("投稿不存在")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /提交作品|保存修改/ }));

    await waitFor(() => {
      expect(apiMocks.updateCreatorSubmission).not.toHaveBeenCalled();
    });
  });

  it("blocks update when existing submission is not editable", async () => {
    apiMocks.getCreatorTaskDetail.mockResolvedValue({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      creatorSubmissionCount: 1
    });
    apiMocks.listCreatorTaskSubmissions.mockResolvedValue([
      {
        id: "submission-1",
        taskId: "task-1",
        creatorId: "creator-1",
        assetUrl: "https://example.com/demo.mp4",
        description: "已通过版本",
        status: "approved",
        rewardTags: ["base"]
      }
    ] as any);
    apiMocks.updateCreatorSubmission.mockResolvedValue({
      id: "submission-1",
      taskId: "task-1",
      creatorId: "creator-1",
      assetUrl: "https://example.com/demo.mp4",
      description: "已通过版本",
      status: "submitted"
    });

    render(
      <MemoryRouter
        initialEntries={["/creator/submission-edit?taskId=task-1&submissionId=submission-1"]}
      >
        <App session={creatorSession} />
      </MemoryRouter>
    );

    expect(await screen.findByText("当前投稿不可修改")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => {
      expect(apiMocks.updateCreatorSubmission).not.toHaveBeenCalled();
    });
  });
});

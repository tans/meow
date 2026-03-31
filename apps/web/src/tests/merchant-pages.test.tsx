import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App, { type WebSession } from "../App.js";
import { MerchantReviewPage } from "../routes/MerchantReviewPage.js";
import { MerchantSettlementPage } from "../routes/MerchantSettlementPage.js";
import { MerchantTaskCreatePage } from "../routes/MerchantTaskCreatePage.js";

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
  })),
  createMerchantTaskDraft: vi.fn(),
  publishMerchantTask: vi.fn(),
  getMerchantTaskDetail: vi.fn(),
  listMerchantTaskSubmissions: vi.fn(async () => []),
  reviewMerchantSubmission: vi.fn(),
  tipMerchantSubmission: vi.fn(),
  addMerchantRankingReward: vi.fn(),
  settleMerchantTask: vi.fn()
}));

vi.mock("../lib/api.js", () => apiMocks);

const merchantSession: WebSession = {
  user: { id: "merchant-1", displayName: "Demo Merchant" },
  activeRole: "merchant",
  roles: ["merchant", "creator"]
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
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
  apiMocks.createMerchantTaskDraft.mockReset();
  apiMocks.publishMerchantTask.mockReset();
  apiMocks.getMerchantTaskDetail.mockReset();
  apiMocks.listMerchantTaskSubmissions.mockReset();
  apiMocks.reviewMerchantSubmission.mockReset();
  apiMocks.tipMerchantSubmission.mockReset();
  apiMocks.addMerchantRankingReward.mockReset();
  apiMocks.settleMerchantTask.mockReset();
});

describe("merchant pages", () => {
  it("updates the budget summary while editing the create form", () => {
    render(<MerchantTaskCreatePage onPublish={vi.fn()} publishing={false} />);

    fireEvent.change(screen.getByLabelText("基础奖金额"), {
      target: { value: "3" }
    });

    expect(screen.getByText("需锁定预算 ¥7")).toBeTruthy();
    expect(screen.getByRole("button", { name: "创建并发布任务" })).toBeTruthy();
  });

  it("renders approve, tip, and ranking actions for review cards", () => {
    render(
      <MerchantReviewPage
        task={{ title: "春季短视频征稿", rewardText: "基础奖 1 x 2 + 排名奖 1" }}
        cards={[
          {
            submissionId: "submission-1",
            creatorText: "创作者 creator-1",
            statusText: "待审核",
            rewardTag: "待审核",
            canApprove: true,
            canTip: true,
            canRanking: true
          }
        ]}
        onApprove={vi.fn()}
        onTip={vi.fn()}
        onRanking={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "通过" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "打赏" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "排名奖" })).toBeTruthy();
  });

  it("renders settlement summary and settle action", () => {
    render(
      <MerchantSettlementPage
        settlement={{
          title: "春季短视频征稿",
          submittedCount: 2,
          approvedCount: 1,
          rewardPreview: ["基础奖已冻结", "打赏已冻结"]
        }}
        onSettle={vi.fn()}
      />
    );

    expect(screen.getByText("投稿 2 · 通过 1")).toBeTruthy();
    expect(screen.getByText("基础奖已冻结")).toBeTruthy();
    expect(screen.getByRole("button", { name: "执行结算" })).toBeTruthy();
  });

  it("wires merchant publish flow from create page to task detail route", async () => {
    apiMocks.createMerchantTaskDraft.mockResolvedValue({
      taskId: "task-1",
      status: "draft"
    });
    apiMocks.publishMerchantTask.mockResolvedValue({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      ledgerEffect: "merchant_escrow_locked"
    });
    apiMocks.getMerchantTaskDetail.mockResolvedValue({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      escrowLockedAmount: 3,
      submissionCount: 0,
      rewardTags: []
    });

    render(
      <MemoryRouter initialEntries={["/merchant/task-create"]}>
        <App session={merchantSession} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "创建并发布任务" }));

    await waitFor(() => {
      expect(apiMocks.createMerchantTaskDraft).toHaveBeenCalled();
      expect(apiMocks.publishMerchantTask).toHaveBeenCalledWith("task-1");
    });

    expect(await screen.findByRole("button", { name: "前往审核" })).toBeTruthy();
  });

  it("keeps local merchant form values in detail after publish", async () => {
    apiMocks.createMerchantTaskDraft.mockResolvedValue({
      taskId: "task-1",
      status: "draft"
    });
    apiMocks.publishMerchantTask.mockResolvedValue({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      ledgerEffect: "merchant_escrow_locked"
    });
    apiMocks.listMerchantTasks.mockResolvedValue([
      {
        id: "task-1",
        merchantId: "merchant-1",
        status: "published",
        escrowLockedAmount: 3,
        submissionCount: 0
      }
    ] as never);
    apiMocks.getMerchantTaskDetail.mockResolvedValue({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      escrowLockedAmount: 3,
      submissionCount: 0,
      rewardTags: []
    });

    render(
      <MemoryRouter initialEntries={["/merchant/task-create"]}>
        <App session={merchantSession} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("任务标题"), {
      target: { value: "夏日探店征稿" }
    });
    fireEvent.change(screen.getByLabelText("基础奖金额"), {
      target: { value: "3" }
    });

    fireEvent.click(screen.getByRole("button", { name: "创建并发布任务" }));

    expect(await screen.findByText("夏日探店征稿")).toBeTruthy();
    expect(screen.getByText("奖励：基础奖 3 x 2 + 排名奖 1")).toBeTruthy();
    expect(screen.getByText("锁定预算 ¥7")).toBeTruthy();
  });

  it("keeps publish success when post-publish refresh fails", async () => {
    apiMocks.createMerchantTaskDraft.mockResolvedValue({
      taskId: "task-1",
      status: "draft"
    });
    apiMocks.publishMerchantTask.mockResolvedValue({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      ledgerEffect: "merchant_escrow_locked"
    });
    apiMocks.listMerchantTasks.mockRejectedValue(new Error("refresh failed"));
    apiMocks.getMerchantTaskDetail.mockResolvedValue({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      escrowLockedAmount: 3,
      submissionCount: 0,
      rewardTags: []
    });

    render(
      <MemoryRouter initialEntries={["/merchant/task-create"]}>
        <App session={merchantSession} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "创建并发布任务" }));

    expect(await screen.findByRole("button", { name: "前往审核" })).toBeTruthy();
    expect(screen.queryByText("发布失败，请确认 API 已启动")).toBeNull();
  });

  it("keeps settlement success when post-settle refresh fails", async () => {
    apiMocks.getMerchantTaskDetail
      .mockResolvedValueOnce({
        id: "task-1",
        merchantId: "merchant-1",
        status: "published",
        escrowLockedAmount: 3,
        submissionCount: 1,
        rewardTags: []
      })
      .mockRejectedValueOnce(new Error("refresh failed"));
    apiMocks.listMerchantTaskSubmissions.mockResolvedValue([
      {
        id: "submission-1",
        taskId: "task-1",
        creatorId: "creator-1",
        status: "approved",
        rewardTags: ["base"]
      }
    ] as never);
    apiMocks.settleMerchantTask.mockResolvedValue({
      taskId: "task-1",
      status: "settled",
      creatorAvailableDelta: 1,
      merchantRefundDelta: 1
    });
    apiMocks.listMerchantTasks.mockRejectedValue(new Error("refresh failed"));

    render(
      <MemoryRouter initialEntries={["/merchant/settlement/task-1"]}>
        <App session={merchantSession} />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: "执行结算" }));

    expect(await screen.findByText("任务 task-1 已结算")).toBeTruthy();
    expect(screen.queryByText("结算失败")).toBeNull();
  });

  it("prevents duplicate review actions while mutation is pending", async () => {
    apiMocks.getMerchantTaskDetail.mockResolvedValue({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      escrowLockedAmount: 3,
      submissionCount: 1,
      rewardTags: []
    });
    apiMocks.listMerchantTaskSubmissions.mockResolvedValue([
      {
        id: "submission-1",
        taskId: "task-1",
        creatorId: "creator-1",
        status: "submitted",
        rewardTags: []
      }
    ] as never);
    const deferred = createDeferred<{
      submissionId: string;
      status: "approved";
      rewardType?: "base";
      rewardStatus?: "frozen" | "cancelled";
    }>();
    apiMocks.reviewMerchantSubmission.mockReturnValue(deferred.promise);

    render(
      <MemoryRouter initialEntries={["/merchant/review/task-1"]}>
        <App session={merchantSession} />
      </MemoryRouter>
    );

    const approveButton = await screen.findByRole("button", { name: "通过" });
    fireEvent.click(approveButton);
    fireEvent.click(approveButton);

    expect(apiMocks.reviewMerchantSubmission).toHaveBeenCalledTimes(1);
    expect(approveButton.getAttribute("disabled")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "打赏" }).getAttribute("disabled")
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "排名奖" }).getAttribute("disabled")
    ).not.toBeNull();

    deferred.resolve({
      submissionId: "submission-1",
      status: "approved",
      rewardType: "base",
      rewardStatus: "frozen"
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "打赏" }).getAttribute("disabled")
      ).toBeNull();
    });
  });
});

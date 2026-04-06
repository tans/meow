import { describe, expect, it } from "vitest";
import {
  buildAwardsModel,
  buildBudgetSummary,
  buildMerchantSettlementSummary,
  buildMerchantTaskMetaFromForm,
  buildProfileModel,
  creatorLobbyChannels,
  mapCreatorSubmissionCard,
  mapCreatorTaskDetail,
  mapCreatorTasks,
  mapCreatorWalletMetrics,
  mapMerchantReviewCard,
  mapMerchantTasks,
  mapMerchantTaskDetail,
} from "./src/lib/models.js";
import type {
  CreatorSubmissionItem,
  CreatorTaskDetail,
  CreatorTaskFeedItem,
  CreatorWalletSnapshot,
  MerchantTaskDetail,
  MerchantTaskListItem,
  SubmissionReadModelItem,
} from "@meow/contracts";

describe("models: creator mapping", () => {
  describe("mapCreatorTasks", () => {
    const makeTask = (overrides: Partial<CreatorTaskFeedItem> = {}): CreatorTaskFeedItem => ({
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      ...overrides,
    });

    it("maps a known task with preset meta", () => {
      const tasks = [makeTask({ id: "task-1", merchantId: "merchant-1" })];
      const result = mapCreatorTasks(tasks);
      expect(result[0]).toMatchObject({
        id: "task-1",
        title: "春季穿搭口播征稿",
        brandName: "奈雪",
        highlightTag: "平台精选",
      });
    });

    it("falls back for unknown task id", () => {
      const tasks = [makeTask({ id: "task-unknown", merchantId: "merchant-1" })];
      const result = mapCreatorTasks(tasks);
      expect(result[0].title).toBe("原生任务 task-unknown");
      expect(result[0].brandName).toBe("奈雪"); // merchant-1 maps to 奈雪 in merchantLabelById
    });

    it("maps non-published status correctly", () => {
      const tasks = [makeTask({ id: "task-unknown-status", merchantId: "merchant-unknown", status: "ended" })];
      const result = mapCreatorTasks(tasks);
      expect(result[0].highlightTag).toBe("已截止");
      expect(result[0].metaText).toBe("0 人参与 · 已截止");
    });
  });

  describe("mapCreatorTaskDetail", () => {
    it("sets canSubmit=true only when status is published", () => {
      const published: CreatorTaskDetail = {
        id: "task-1",
        merchantId: "merchant-1",
        status: "published",
        creatorSubmissionCount: 0,
      };
      expect(mapCreatorTaskDetail(published).canSubmit).toBe(true);

      const ended: CreatorTaskDetail = { ...published, status: "ended" };
      expect(mapCreatorTaskDetail(ended).canSubmit).toBe(false);

      const settled: CreatorTaskDetail = { ...published, status: "settled" };
      expect(mapCreatorTaskDetail(settled).canSubmit).toBe(false);
    });
  });

  describe("mapCreatorSubmissionCard", () => {
    const makeSubmission = (
      status: CreatorSubmissionItem["status"],
      rewardTags: Array<"base" | "ranking" | "tip"> = []
    ): CreatorSubmissionItem =>
      ({
        id: "sub-1",
        taskId: "task-1",
        creatorId: "creator-1",
        status,
        rewardTags,
        assetUrl: "https://example.com/demo.mp4",
        description: "示例投稿",
      }) as CreatorSubmissionItem;

    it('submitted → canEdit=true, canWithdraw=true', () => {
      const card = mapCreatorSubmissionCard(makeSubmission("submitted"));
      expect(card.canEdit).toBe(true);
      expect(card.canWithdraw).toBe(true);
      expect(card.statusText).toBe("待审核");
    });

    it('approved → canEdit=false, canWithdraw=false', () => {
      const card = mapCreatorSubmissionCard(makeSubmission("approved"));
      expect(card.canEdit).toBe(false);
      expect(card.canWithdraw).toBe(false);
      expect(card.statusText).toBe("已通过");
    });

    it("uses rewardTag when rewardTags is non-empty", () => {
      const card = mapCreatorSubmissionCard(makeSubmission("approved", ["base", "ranking"]));
      expect(card.rewardTag).toBe("base/ranking");
    });

    it("falls back to statusText when rewardTags is empty", () => {
      const card = mapCreatorSubmissionCard(makeSubmission("rejected"));
      expect(card.rewardTag).toBe("已驳回");
    });
  });

  describe("mapCreatorWalletMetrics", () => {
    it("formats frozenAmount, availableAmount and submissionCount", () => {
      const snapshot: CreatorWalletSnapshot = {
        creatorId: "creator-1",
        frozenAmount: 150,
        availableAmount: 320,
        submissionCount: 12,
      };
      const metrics = mapCreatorWalletMetrics(snapshot);
      expect(metrics).toEqual([
        { label: "冻结收益", value: "¥150" },
        { label: "可提现", value: "¥320" },
        { label: "累计投稿", value: "12" },
      ]);
    });
  });
});

describe("models: merchant mapping", () => {
  describe("mapMerchantTasks", () => {
    const makeTask = (overrides: Partial<MerchantTaskListItem> = {}): MerchantTaskListItem => ({
      id: "task-m1",
      merchantId: "merchant-1",
      title: "",
      status: "published",
      escrowLockedAmount: 1000,
      submissionCount: 5,
      assetAttachments: [],
      ...overrides,
    });

    it("uses task title when provided", () => {
      const tasks = [makeTask({ id: "task-m1", title: "商家任务标题" })];
      expect(mapMerchantTasks(tasks)[0].title).toBe("商家任务标题");
    });

    it("falls back to taskMetaById title", () => {
      const tasks = [makeTask({ id: "task-m1", title: "" })];
      const meta = { "task-m1": { title: "本地元数据标题", rewardText: "", lockedBudgetText: "" } };
      expect(mapMerchantTasks(tasks, meta)[0].title).toBe("本地元数据标题");
    });

    it("maps all task statuses to Chinese text", () => {
      const statuses: MerchantTaskListItem["status"][] = [
        "draft", "published", "paused", "ended", "settled", "closed",
      ];
      const expected = ["草稿中", "征集中", "已暂停", "已截止", "已结算", "已关闭"];
      const tasks = statuses.map((status, i) => makeTask({ id: `task-${i}`, status }));
      const results = mapMerchantTasks(tasks);
      results.forEach((r, i) => {
        expect(r.statusText).toBe(expected[i]);
      });
    });
  });

  describe("buildBudgetSummary", () => {
    it("computes baseAmount * baseCount + rankingTotal", () => {
      expect(buildBudgetSummary({ baseAmount: 50, baseCount: 10, rankingTotal: 200 })).toEqual({
        lockedTotal: 700,
      });
    });

    it("handles zero values", () => {
      expect(buildBudgetSummary({ baseAmount: 0, baseCount: 0, rankingTotal: 0 })).toEqual({
        lockedTotal: 0,
      });
    });
  });

  describe("buildMerchantTaskMetaFromForm", () => {
    it("formats rewardText and lockedBudgetText", () => {
      const form = {
        title: "测试任务",
        baseAmount: 100,
        baseCount: 5,
        rankingTotal: 300,
        assetAttachments: [],
      };
      const meta = buildMerchantTaskMetaFromForm(form);
      expect(meta.title).toBe("测试任务");
      expect(meta.rewardText).toBe("基础奖 100 x 5 + 排名奖 300");
      expect(meta.lockedBudgetText).toBe("¥800");
    });
  });

  describe("mapMerchantTaskDetail", () => {
    const makeDetail = (overrides: Partial<MerchantTaskDetail> = {}): MerchantTaskDetail =>
      ({
        id: "task-m1",
        merchantId: "merchant-1",
        title: "",
        status: "published",
        escrowLockedAmount: 500,
        submissionCount: 3,
        assetAttachments: [],
        rewardTags: [],
        ...overrides,
      }) as MerchantTaskDetail;

    it("uses taskMetaById rewardText when available", () => {
      const task = makeDetail({ title: "" });
      const meta = { "task-m1": { title: "", rewardText: "自定义奖励", lockedBudgetText: "¥999" } };
      expect(mapMerchantTaskDetail(task, meta).rewardText).toBe("自定义奖励");
    });

    it("falls back to rewardTags join", () => {
      const task = makeDetail({ rewardTags: ["base", "ranking"] });
      expect(mapMerchantTaskDetail(task).rewardText).toBe("base/ranking");
    });

    it("falls back to default rewardText when both empty", () => {
      const task = makeDetail({ title: "", rewardTags: [] });
      expect(mapMerchantTaskDetail(task).rewardText).toBe("基础奖+排名奖");
    });
  });

  describe("mapMerchantReviewCard", () => {
    const makeSubmission = (
      status: SubmissionReadModelItem["status"],
      rewardTags: Array<"base" | "ranking" | "tip"> = []
    ): SubmissionReadModelItem =>
      ({
        id: "sub-1",
        taskId: "task-m1",
        creatorId: "creator-1",
        status,
        rewardTags,
      }) as SubmissionReadModelItem;

    it("canApprove only for submitted", () => {
      expect(mapMerchantReviewCard(makeSubmission("submitted")).canApprove).toBe(true);
      expect(mapMerchantReviewCard(makeSubmission("approved")).canApprove).toBe(false);
      expect(mapMerchantReviewCard(makeSubmission("rejected")).canApprove).toBe(false);
      expect(mapMerchantReviewCard(makeSubmission("withdrawn")).canApprove).toBe(false);
    });

    it("canTip and canRanking are false only for withdrawn", () => {
      const withdrawn = mapMerchantReviewCard(makeSubmission("withdrawn"));
      expect(withdrawn.canTip).toBe(false);
      expect(withdrawn.canRanking).toBe(false);

      const submitted = mapMerchantReviewCard(makeSubmission("submitted"));
      expect(submitted.canTip).toBe(true);
      expect(submitted.canRanking).toBe(true);
    });
  });

  describe("buildMerchantSettlementSummary", () => {
    it("counts approved submissions and collects reward previews", () => {
      const task = { id: "task-m1", title: "结算任务", statusText: "", rewardText: "", submissionCount: 3, lockedBudgetText: "", rewardTags: [], assetAttachments: [] };
      const submissions: SubmissionReadModelItem[] = [
        { id: "s1", taskId: "task-m1", creatorId: "c1", status: "approved", rewardTags: ["base"] },
        { id: "s2", taskId: "task-m1", creatorId: "c2", status: "submitted", rewardTags: [] },
        { id: "s3", taskId: "task-m1", creatorId: "c3", status: "approved", rewardTags: ["ranking"] },
      ] as SubmissionReadModelItem[];
      const result = buildMerchantSettlementSummary(task, submissions);
      expect(result.submittedCount).toBe(3);
      expect(result.approvedCount).toBe(2);
      expect(result.rewardPreview).toEqual(["base", "ranking"]);
    });

    it("handles null task", () => {
      const result = buildMerchantSettlementSummary(null, []);
      expect(result.title).toBe("待结算任务");
    });
  });
});

describe("models: static builders", () => {
  describe("buildAwardsModel", () => {
    it("marks activePeriod and activeCategory correctly", () => {
      const model = buildAwardsModel("本月", "美妆");
      expect(model.periods.find((p) => p.active)?.label).toBe("本月");
      expect(model.categories.find((c) => c.active)?.label).toBe("美妆");
    });

    it("defaults to 本周 and 全部", () => {
      const model = buildAwardsModel();
      expect(model.periods.find((p) => p.active)?.label).toBe("本周");
      expect(model.categories.find((c) => c.active)?.label).toBe("全部");
    });

    it("has 3 periods and 5 categories", () => {
      expect(buildAwardsModel().periods).toHaveLength(3);
      expect(buildAwardsModel().categories).toHaveLength(5);
    });
  });

  describe("buildProfileModel", () => {
    it("returns a complete profile model", () => {
      const model = buildProfileModel();
      expect(model.title).toBe("我的");
      expect(model.creatorName).toBe("阿喵创作社");
      expect(model.quickLinks).toHaveLength(3);
      expect(model.quickLinks[0]).toMatchObject({ title: "我的投稿", path: "/creator/task-feed" });
      expect(model.merchantEntry.actionText).toBe("进入需求侧");
    });
  });

  describe("creatorLobbyChannels", () => {
    it("exports the expected channel list", () => {
      expect(creatorLobbyChannels).toEqual(["推荐", "品牌合作", "急单", "同城"]);
    });
  });
});

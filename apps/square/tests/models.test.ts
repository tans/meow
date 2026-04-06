import { describe, expect, it } from "vitest";
import type {
  CreatorSubmissionItem,
  CreatorTaskDetail,
  CreatorTaskFeedItem,
  CreatorWalletSnapshot,
  MerchantTaskAttachment,
  MerchantTaskDetail,
  MerchantTaskListItem,
  SubmissionReadModelItem
} from "@meow/contracts";
import {
  buildAwardsModel,
  buildBudgetSummary,
  buildMerchantSettlementSummary,
  buildMerchantTaskMetaFromForm,
  buildProfileModel,
  mapCreatorSubmissionCard,
  mapCreatorTaskDetail,
  mapCreatorTasks,
  mapCreatorWalletMetrics,
  mapMerchantReviewCard,
  mapMerchantTasks
} from "../src/lib/models.js";

const attachment: MerchantTaskAttachment = {
  id: "asset-1",
  kind: "image",
  url: "https://example.com/asset-1.png",
  fileName: "asset-1.png",
  mimeType: "image/png"
};

describe("models", () => {
  it("mapCreatorTasks maps preset data, published fallback, and unknown task ids", () => {
    const tasks: CreatorTaskFeedItem[] = [
      { id: "task-1", merchantId: "merchant-1", status: "published" },
      { id: "task-999", merchantId: "merchant-2", status: "published" },
      { id: "task-404", merchantId: "merchant-x", status: "published" }
    ];

    const result = mapCreatorTasks(tasks);

    expect(result).toEqual([
      {
        id: "task-1",
        title: "春季穿搭口播征稿",
        brandName: "奈雪",
        summary: "到店拍摄 15 秒短视频，突出新品和门店氛围",
        rewardText: "基础奖 1 x 2 + 排名奖 1",
        metaText: "126 人参与 · 距截止 3 天",
        highlightTag: "平台精选"
      },
      {
        id: "task-999",
        title: "原生任务 task-999",
        brandName: "PMPM",
        summary: "查看任务详情和奖励规则",
        rewardText: "基础奖 1 x 2 + 排名奖 1",
        metaText: "0 人参与 · 长期征稿",
        highlightTag: "新发布"
      },
      {
        id: "task-404",
        title: "原生任务 task-404",
        brandName: "需求方 merchant-x",
        summary: "查看任务详情和奖励规则",
        rewardText: "基础奖 1 x 2 + 排名奖 1",
        metaText: "0 人参与 · 长期征稿",
        highlightTag: "新发布"
      }
    ]);
  });

  it("mapCreatorTaskDetail enables submit only for published tasks", () => {
    const published: CreatorTaskDetail = {
      id: "task-1",
      merchantId: "merchant-1",
      status: "published",
      creatorSubmissionCount: 3
    };
    const paused: CreatorTaskDetail = {
      ...published,
      id: "task-2",
      status: "paused"
    };

    expect(mapCreatorTaskDetail(published).canSubmit).toBe(true);
    expect(mapCreatorTaskDetail(paused).canSubmit).toBe(false);
  });

  it("mapCreatorSubmissionCard maps submitted approved rejected withdrawn statuses", () => {
    const cases: Array<{
      submission: CreatorSubmissionItem;
      expected: {
        statusText: string;
        rewardTag: string;
        canEdit: boolean;
        canWithdraw: boolean;
      };
    }> = [
      {
        submission: {
          id: "submission-1",
          taskId: "task-1",
          creatorId: "creator-1",
          assetUrl: "https://example.com/1.mp4",
          description: "submitted",
          status: "submitted",
          rewardTags: []
        },
        expected: {
          statusText: "待审核",
          rewardTag: "待审核",
          canEdit: true,
          canWithdraw: true
        }
      },
      {
        submission: {
          id: "submission-2",
          taskId: "task-1",
          creatorId: "creator-1",
          assetUrl: "https://example.com/2.mp4",
          description: "approved",
          status: "approved",
          rewardTags: ["base", "tip"]
        },
        expected: {
          statusText: "已通过",
          rewardTag: "base/tip",
          canEdit: false,
          canWithdraw: false
        }
      },
      {
        submission: {
          id: "submission-3",
          taskId: "task-1",
          creatorId: "creator-1",
          assetUrl: "https://example.com/3.mp4",
          description: "rejected",
          status: "rejected",
          rewardTags: []
        },
        expected: {
          statusText: "已驳回",
          rewardTag: "已驳回",
          canEdit: false,
          canWithdraw: false
        }
      },
      {
        submission: {
          id: "submission-4",
          taskId: "task-1",
          creatorId: "creator-1",
          assetUrl: "https://example.com/4.mp4",
          description: "withdrawn",
          status: "withdrawn",
          rewardTags: []
        },
        expected: {
          statusText: "已撤回",
          rewardTag: "已撤回",
          canEdit: false,
          canWithdraw: false
        }
      }
    ];

    expect(cases.map(({ submission }) => mapCreatorSubmissionCard(submission))).toEqual(
      cases.map(({ submission, expected }) => ({
        submissionId: submission.id,
        taskId: submission.taskId,
        title: `投稿 ${submission.id}`,
        ...expected
      }))
    );
  });

  it("mapCreatorWalletMetrics formats amount and count fields", () => {
    const snapshot: CreatorWalletSnapshot = {
      creatorId: "creator-1",
      frozenAmount: 88,
      availableAmount: 120.5,
      submissionCount: 16
    };

    expect(mapCreatorWalletMetrics(snapshot)).toEqual([
      { label: "冻结收益", value: "¥88" },
      { label: "可提现", value: "¥120.5" },
      { label: "累计投稿", value: "16" }
    ]);
  });

  it("buildAwardsModel marks only the selected period and category as active", () => {
    const result = buildAwardsModel("本月", "美妆");

    expect(result.periods).toEqual([
      { label: "本周", value: "本周", active: false },
      { label: "本月", value: "本月", active: true },
      { label: "全部", value: "全部", active: false }
    ]);
    expect(result.categories).toEqual([
      { label: "全部", value: "全部", active: false },
      { label: "美妆", value: "美妆", active: true },
      { label: "探店", value: "探店", active: false },
      { label: "穿搭", value: "穿搭", active: false },
      { label: "家居", value: "家居", active: false }
    ]);
    expect(result.featuredCards).toHaveLength(2);
  });

  it("buildProfileModel returns the expected page structure", () => {
    const result = buildProfileModel();

    expect(result.title).toBe("我的");
    expect(result.creatorName).toBe("阿喵创作社");
    expect(result.creatorTags).toEqual(["探店", "美妆", "穿搭"]);
    expect(result.stats).toHaveLength(4);
    expect(result.quickLinks).toEqual([
      { title: "我的投稿", path: "/creator/task-feed" },
      { title: "收益明细", path: "/wallet" },
      { title: "合作记录", path: "/creator/earnings" }
    ]);
    expect(result.merchantEntry).toEqual({
      title: "发布需求",
      description: "需要发起品牌合作需求时，从这里进入需求侧管理",
      actionText: "进入需求侧"
    });
  });

  it("mapMerchantTasks maps each merchant status to the correct label", () => {
    const tasks: MerchantTaskListItem[] = [
      {
        id: "task-draft",
        merchantId: "merchant-1",
        title: "",
        status: "draft",
        escrowLockedAmount: 0,
        submissionCount: 1,
        assetAttachments: [attachment]
      },
      {
        id: "task-published",
        merchantId: "merchant-1",
        title: "",
        status: "published",
        escrowLockedAmount: 0,
        submissionCount: 2,
        assetAttachments: [attachment]
      },
      {
        id: "task-paused",
        merchantId: "merchant-1",
        title: "",
        status: "paused",
        escrowLockedAmount: 0,
        submissionCount: 3,
        assetAttachments: [attachment]
      },
      {
        id: "task-ended",
        merchantId: "merchant-1",
        title: "",
        status: "ended",
        escrowLockedAmount: 0,
        submissionCount: 4,
        assetAttachments: [attachment]
      },
      {
        id: "task-settled",
        merchantId: "merchant-1",
        title: "",
        status: "settled",
        escrowLockedAmount: 0,
        submissionCount: 5,
        assetAttachments: [attachment]
      },
      {
        id: "task-closed",
        merchantId: "merchant-1",
        title: "",
        status: "closed",
        escrowLockedAmount: 0,
        submissionCount: 6,
        assetAttachments: [attachment]
      }
    ];

    expect(mapMerchantTasks(tasks).map((item) => item.statusText)).toEqual([
      "草稿中",
      "征集中",
      "已暂停",
      "已截止",
      "已结算",
      "已关闭"
    ]);
  });

  it("buildBudgetSummary computes locked total from base and ranking rewards", () => {
    expect(
      buildBudgetSummary({
        baseAmount: 50,
        baseCount: 3,
        rankingTotal: 120
      })
    ).toEqual({ lockedTotal: 270 });
  });

  it("buildMerchantTaskMetaFromForm returns formatted reward and budget text", () => {
    expect(
      buildMerchantTaskMetaFromForm({
        title: "春季探店任务",
        baseAmount: 80,
        baseCount: 2,
        rankingTotal: 40,
        assetAttachments: [attachment]
      })
    ).toEqual({
      title: "春季探店任务",
      rewardText: "基础奖 80 x 2 + 排名奖 40",
      lockedBudgetText: "¥200"
    });
  });

  it("mapMerchantReviewCard derives canApprove canTip and canRanking from status", () => {
    const cases: SubmissionReadModelItem[] = [
      {
        id: "submission-submitted",
        taskId: "task-1",
        creatorId: "creator-1",
        status: "submitted",
        rewardTags: []
      },
      {
        id: "submission-approved",
        taskId: "task-1",
        creatorId: "creator-1",
        status: "approved",
        rewardTags: ["base"]
      },
      {
        id: "submission-rejected",
        taskId: "task-1",
        creatorId: "creator-1",
        status: "rejected",
        rewardTags: []
      },
      {
        id: "submission-withdrawn",
        taskId: "task-1",
        creatorId: "creator-1",
        status: "withdrawn",
        rewardTags: []
      }
    ];

    expect(cases.map((item) => mapMerchantReviewCard(item))).toEqual([
      {
        submissionId: "submission-submitted",
        creatorText: "创作者 creator-1",
        statusText: "待审核",
        rewardTag: "待审核",
        canApprove: true,
        canTip: true,
        canRanking: true
      },
      {
        submissionId: "submission-approved",
        creatorText: "创作者 creator-1",
        statusText: "已通过",
        rewardTag: "base",
        canApprove: false,
        canTip: true,
        canRanking: true
      },
      {
        submissionId: "submission-rejected",
        creatorText: "创作者 creator-1",
        statusText: "已驳回",
        rewardTag: "已驳回",
        canApprove: false,
        canTip: true,
        canRanking: true
      },
      {
        submissionId: "submission-withdrawn",
        creatorText: "创作者 creator-1",
        statusText: "已撤回",
        rewardTag: "已撤回",
        canApprove: false,
        canTip: false,
        canRanking: false
      }
    ]);
  });

  it("buildMerchantSettlementSummary calculates counts and reward preview", () => {
    const task: MerchantTaskDetail = {
      id: "task-1",
      merchantId: "merchant-1",
      title: "春季探店",
      status: "published",
      escrowLockedAmount: 280,
      submissionCount: 4,
      assetAttachments: [attachment],
      rewardTags: ["base", "ranking"]
    };
    const mappedTask = {
      id: task.id,
      title: task.title,
      statusText: "征集中",
      rewardText: "基础奖+排名奖",
      submissionCount: task.submissionCount,
      lockedBudgetText: "¥280",
      rewardTags: task.rewardTags,
      assetAttachments: task.assetAttachments
    };
    const submissions: SubmissionReadModelItem[] = [
      {
        id: "submission-1",
        taskId: "task-1",
        creatorId: "creator-1",
        status: "approved",
        rewardTags: ["base"]
      },
      {
        id: "submission-2",
        taskId: "task-1",
        creatorId: "creator-2",
        status: "submitted",
        rewardTags: []
      },
      {
        id: "submission-3",
        taskId: "task-1",
        creatorId: "creator-3",
        status: "approved",
        rewardTags: ["ranking", "tip"]
      }
    ];

    expect(buildMerchantSettlementSummary(mappedTask, submissions)).toEqual({
      title: "春季探店",
      submittedCount: 3,
      approvedCount: 2,
      rewardPreview: ["base", "ranking/tip"]
    });
  });
});

import { describe, expect, it } from "vitest";
import { mergeCreatorTaskDetail } from "../services/tasks.js";
import { mapCreatorSubmissionCard, mapReviewCard } from "../view-models/review.js";

describe("creator task detail mapping", () => {
  it("merges api detail with local task meta for native creator pages", () => {
    expect(
      mergeCreatorTaskDetail(
        {
          id: "task-1",
          merchantId: "merchant-1",
          status: "published",
          creatorSubmissionCount: 2
        },
        {
          title: "探店视频任务",
          rewardText: "基础奖 1 x 3 + 排名奖 5"
        }
      )
    ).toMatchObject({
      id: "task-1",
      title: "探店视频任务",
      status: "published",
      rewardText: "基础奖 1 x 3 + 排名奖 5",
      creatorSubmissionCount: 2,
      canSubmit: true
    });
  });

  it("marks closed tasks as not submittable", () => {
    expect(
      mergeCreatorTaskDetail(
        {
          id: "task-2",
          merchantId: "merchant-1",
          status: "settled",
          creatorSubmissionCount: 1
        },
        {}
      )
    ).toMatchObject({
      id: "task-2",
      status: "settled",
      rewardText: "基础奖+排名奖",
      creatorSubmissionCount: 1,
      canSubmit: false
    });
  });

  it("maps creator submission records for the detail page", () => {
    expect(
      mapCreatorSubmissionCard({
        id: "submission-1",
        status: "submitted",
        rewardTag: "待审核"
      })
    ).toMatchObject({
      submissionId: "submission-1",
      statusText: "待审核",
      rewardTag: "待审核",
      canEdit: true,
      canWithdraw: true
    });
  });

  it("maps withdrawn submissions as read-only cards", () => {
    expect(
      mapCreatorSubmissionCard({
        id: "submission-2",
        status: "withdrawn",
        rewardTag: "已撤回"
      })
    ).toMatchObject({
      submissionId: "submission-2",
      statusText: "已撤回",
      canEdit: false,
      canWithdraw: false
    });
  });

  it("maps withdrawn merchant review cards as read-only", () => {
    expect(
      mapReviewCard({
        id: "submission-3",
        creatorId: "creator-1",
        status: "withdrawn",
        rewardTag: "已撤回"
      })
    ).toMatchObject({
      submissionId: "submission-3",
      statusText: "已撤回",
      rewardTag: "已撤回",
      canApprove: false,
      canTip: false,
      canRanking: false
    });
  });
});

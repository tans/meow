import { describe, expect, it } from "vitest";
import { mapTaskCard } from "../view-models/task-feed.js";

describe("task feed cards", () => {
  it("maps a public task into a community lobby card", () => {
    expect(
      mapTaskCard({
        id: "task-1",
        title: "春日探店短视频",
        brandName: "奈雪",
        category: "探店",
        summary: "到店拍摄 15 秒短视频，突出新品和门店氛围",
        status: "published",
        rewardText: "参与奖 50 / 名次奖 500",
        participantCount: 126,
        deadlineText: "距截止 3 天",
        highlightTag: "平台精选",
        coverTheme: "peach"
      })
    ).toMatchObject({
      id: "task-1",
      title: "春日探店短视频",
      brandName: "奈雪",
      category: "探店",
      metaText: "126 人参与 · 距截止 3 天",
      primaryActionText: "立即报名",
      secondaryActionText: "查看详情",
      highlightTag: "平台精选",
      coverClassName: "task-card__cover--peach"
    });
  });

  it("marks closed tasks as ended cards", () => {
    expect(
      mapTaskCard({
        id: "task-2",
        title: "家居图文任务",
        status: "settled",
        brandName: "木墨",
        category: "家居",
        summary: "居家收纳改造分享",
        rewardText: "参与奖 30 / 名次奖 300",
        participantCount: 40,
        deadlineText: "已截止",
        highlightTag: "品牌合作",
        coverTheme: "mint"
      })
    ).toMatchObject({
      statusText: "已截止",
      primaryActionText: "查看详情"
    });
  });
});

import { describe, expect, it } from "vitest";
import { filterTaskCardsByChannel, mapTaskCard } from "../view-models/task-feed.js";

describe("task feed cards", () => {
  it("maps a public task into a community lobby card", () => {
    expect(
      mapTaskCard({
        id: "task-1",
        merchantId: "merchant-1",
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
      coverClassName: "task-card__cover--peach",
      badge: "进行中",
      merchantText: "商家 merchant-1"
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
      primaryActionText: "查看详情",
      badge: "已下架",
      merchantText: "公开任务"
    });
  });

  it("derives fallback lobby card fields for unknown tasks with generic metadata", () => {
    expect(
      mapTaskCard({
        id: "task-new-100",
        merchantId: "merchant-77",
        title: "新品图文征集",
        status: "published",
        rewardText: "基础奖+排名奖",
        brandName: "品牌合作",
        category: "推荐",
        summary: "查看任务详情和奖励规则",
        participantCount: 0,
        deadlineText: "长期征稿",
        highlightTag: "新发布",
        coverTheme: "sand"
      })
    ).toMatchObject({
      brandName: "商家 merchant-77",
      category: "推荐",
      summary: "新品图文征集 进行征稿，查看任务详情和奖励规则",
      metaText: "0 人参与 · 长期征稿"
    });
  });

  it("filters cards by selected lobby channel", () => {
    const cards = [
      mapTaskCard({
        id: "task-1",
        title: "春日探店短视频",
        brandName: "奈雪",
        category: "探店",
        summary: "到店拍摄",
        status: "published",
        rewardText: "参与奖 50 / 名次奖 500",
        participantCount: 126,
        deadlineText: "距截止 3 天",
        highlightTag: "平台精选",
        coverTheme: "peach"
      }),
      mapTaskCard({
        id: "task-2",
        title: "品牌合作口播",
        brandName: "PMPM",
        category: "美妆",
        summary: "品牌口播",
        status: "published",
        rewardText: "参与奖 20 / 名次奖 300",
        participantCount: 84,
        deadlineText: "距截止 1 天",
        highlightTag: "品牌合作",
        coverTheme: "rose"
      }),
      mapTaskCard({
        id: "task-3",
        title: "同城到店拍摄",
        brandName: "木墨",
        category: "家居",
        summary: "同城约拍",
        status: "published",
        rewardText: "参与奖 30 / 名次奖 300",
        participantCount: 40,
        deadlineText: "同城可约拍",
        highlightTag: "同城",
        coverTheme: "mint"
      })
    ];

    expect(filterTaskCardsByChannel(cards, "推荐").map((item) => item.id)).toEqual([
      "task-1",
      "task-2",
      "task-3"
    ]);
    expect(filterTaskCardsByChannel(cards, "品牌合作").map((item) => item.id)).toEqual([
      "task-2"
    ]);
    expect(filterTaskCardsByChannel(cards, "急单").map((item) => item.id)).toEqual([
      "task-2"
    ]);
    expect(filterTaskCardsByChannel(cards, "同城").map((item) => item.id)).toEqual([
      "task-3"
    ]);
  });
});

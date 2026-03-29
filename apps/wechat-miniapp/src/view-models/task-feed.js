const coverClassByTheme = {
  peach: "task-card__cover--peach",
  rose: "task-card__cover--rose",
  mint: "task-card__cover--mint",
  sand: "task-card__cover--sand"
};
const fallbackThemes = ["sand", "peach", "rose", "mint"];
const genericSummary = "查看任务详情和奖励规则";

const channelPredicates = {
  推荐: () => true,
  品牌合作: (card) =>
    card.highlightTag === "品牌合作" ||
    card.highlightTag === "奖金高" ||
    card.category === "品牌合作" ||
    card.brandName === "品牌合作",
  急单: (card) =>
    (card.metaText && card.metaText.includes("1 天")) ||
    (card.metaText && card.metaText.includes("今日")) ||
    (card.metaText && card.metaText.includes("急")),
  同城: (card) =>
    (card.metaText && card.metaText.includes("同城")) ||
    card.highlightTag === "同城"
};

export const filterTaskCardsByChannel = (cards, activeChannel = "推荐") => {
  const match = channelPredicates[activeChannel];

  if (!match) {
    return cards;
  }

  return cards.filter((card) => match(card));
};

const pickFallbackTheme = (task) => {
  const seed = `${task.id || ""}${task.title || ""}`;
  let sum = 0;

  for (let index = 0; index < seed.length; index += 1) {
    sum += seed.charCodeAt(index);
  }

  return fallbackThemes[sum % fallbackThemes.length];
};

export const mapTaskCard = (task) => {
  const isOpen = task.status === "published";
  const hasGenericLobbyMeta =
    task.brandName === "品牌合作" &&
    task.category === "推荐" &&
    task.summary === genericSummary;
  const brandName =
    !task.brandName || hasGenericLobbyMeta
      ? task.merchantId
        ? `商家 ${task.merchantId}`
        : "品牌合作"
      : task.brandName;
  const category = task.category || "推荐";
  const summary =
    !task.summary || task.summary === genericSummary
      ? `${task.title} 进行征稿，查看任务详情和奖励规则`
      : task.summary;
  const participantCount =
    task.participantCount ?? task.creatorSubmissionCount ?? task.submissionCount ?? 0;
  const deadlineText = task.deadlineText || (isOpen ? "长期征稿" : "已截止");
  const coverTheme =
    !task.coverTheme || (task.coverTheme === "sand" && hasGenericLobbyMeta)
      ? pickFallbackTheme(task)
      : task.coverTheme;

  return {
    id: task.id,
    title: task.title,
    brandName,
    category,
    summary,
    rewardText: task.rewardText,
    metaText: `${participantCount} 人参与 · ${deadlineText}`,
    highlightTag: task.highlightTag || (isOpen ? "新发布" : "已截止"),
    badge: isOpen ? "进行中" : "已下架",
    statusText: isOpen ? "进行中" : "已截止",
    merchantText: task.merchantId ? `商家 ${task.merchantId}` : "公开任务",
    primaryActionText: isOpen ? "立即报名" : "查看详情",
    secondaryActionText: "查看详情",
    coverClassName: coverClassByTheme[coverTheme] || coverClassByTheme.sand
  };
};

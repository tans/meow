const coverClassByTheme = {
  peach: "task-card__cover--peach",
  rose: "task-card__cover--rose",
  mint: "task-card__cover--mint",
  sand: "task-card__cover--sand"
};

export const mapTaskCard = (task) => {
  const isOpen = task.status === "published";

  return {
    id: task.id,
    title: task.title,
    brandName: task.brandName,
    category: task.category,
    summary: task.summary,
    rewardText: task.rewardText,
    metaText: `${task.participantCount} 人参与 · ${task.deadlineText}`,
    highlightTag: task.highlightTag,
    statusText: isOpen ? "进行中" : "已截止",
    primaryActionText: isOpen ? "立即报名" : "查看详情",
    secondaryActionText: "查看详情",
    coverClassName: coverClassByTheme[task.coverTheme] || coverClassByTheme.sand
  };
};

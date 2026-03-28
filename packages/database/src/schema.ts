export const taskStatuses = [
  "draft",
  "published",
  "paused",
  "ended",
  "settled",
  "closed"
] as const;

export const submissionStatuses = [
  "submitted",
  "approved",
  "rejected",
  "withdrawn"
] as const;

export const rewardTypes = ["base", "ranking", "tip"] as const;

export const rewardStatuses = ["frozen", "available", "cancelled"] as const;

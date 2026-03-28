export const mapReviewCard = (submission) => ({
  submissionId: submission.id,
  creatorText: `创作者 ${submission.creatorId || "creator-1"}`,
  statusText:
    submission.status === "approved"
      ? "已通过"
      : submission.status === "rejected"
        ? "已驳回"
        : "待审核",
  rewardTag: submission.rewardTag || "待审核",
  canApprove: submission.status === "submitted"
});

export const buildSettlementSummary = (task, submissions) => ({
  title: task?.title || "待结算任务",
  submittedCount: submissions.length,
  approvedCount: submissions.filter((item) => item.status === "approved").length,
  rewardPreview: submissions
    .filter((item) => item.rewardTag && item.rewardTag !== "待审核")
    .map((item) => item.rewardTag)
});

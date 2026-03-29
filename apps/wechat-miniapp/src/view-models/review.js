export const mapReviewCard = (submission) => ({
  submissionId: submission.id,
  creatorText: `创作者 ${submission.creatorId || "creator-1"}`,
  statusText:
    submission.status === "approved"
      ? "已通过"
      : submission.status === "rejected"
        ? "已驳回"
        : submission.status === "withdrawn"
          ? "已撤回"
        : "待审核",
  rewardTag:
    submission.rewardTag ||
    (submission.status === "withdrawn"
      ? "已撤回"
      : submission.status === "rejected"
        ? "已驳回"
        : "待审核"),
  canApprove: submission.status === "submitted",
  canTip: submission.status !== "withdrawn",
  canRanking: submission.status !== "withdrawn"
});

export const mapCreatorSubmissionCard = (submission) => ({
  submissionId: submission.id,
  title: `投稿 ${submission.id}`,
  statusText:
    submission.status === "approved"
      ? "已通过"
      : submission.status === "rejected"
        ? "已驳回"
        : submission.status === "withdrawn"
          ? "已撤回"
        : "待审核",
  rewardTag:
    submission.rewardTag ||
    (submission.status === "withdrawn"
      ? "已撤回"
      : submission.status === "rejected"
        ? "已驳回"
        : "待审核"),
  canEdit: submission.status === "submitted",
  canWithdraw: submission.status === "submitted"
});

export const buildSettlementSummary = (task, submissions) => ({
  title: task?.title || "待结算任务",
  submittedCount: submissions.length,
  approvedCount: submissions.filter((item) => item.status === "approved").length,
  rewardPreview: submissions
    .filter((item) => item.rewardTag && item.rewardTag !== "待审核")
    .map((item) => item.rewardTag)
});

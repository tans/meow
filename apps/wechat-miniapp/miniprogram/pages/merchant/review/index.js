import { listTaskSubmissions, reviewTaskSubmission, tipTaskSubmission, addRankingReward } from "../../../../src/services/submissions.js";
import { getSelectedTask } from "../../../../src/services/tasks.js";
import { mapReviewCard } from "../../../../src/view-models/review.js";

Page({
  data: {
    title: "稿件审核",
    summary: "原生商家页：审核稿件、通过后冻结基础奖。",
    task: null,
    cards: [],
    feedback: "",
    error: ""
  },

  async onShow() {
    const task = await getSelectedTask();
    const submissions = task ? await listTaskSubmissions(task.id) : [];

    this.setData({
      task,
      cards: submissions.map(mapReviewCard),
      feedback: "",
      error: ""
    });
  },

  async onApproveTap(event) {
    await this.runMutation(event, "approve");
  },

  async onTipTap(event) {
    await this.runMutation(event, "tip");
  },

  async onRankingTap(event) {
    await this.runMutation(event, "ranking");
  },

  async runMutation(event, action) {
    const { submissionId, index } = event.currentTarget.dataset;

    try {
      if (action === "approve") {
        await reviewTaskSubmission(this.data.task.id, submissionId);
        const submissions = await listTaskSubmissions(this.data.task.id);
        this.setData({
          cards: submissions.map(mapReviewCard),
          feedback: "已审核通过并冻结基础奖",
          error: ""
        });
        return;
      }

      if (action === "tip") {
        await tipTaskSubmission(this.data.task.id, submissionId);
        const submissions = await listTaskSubmissions(this.data.task.id);
        this.setData({
          cards: submissions.map(mapReviewCard),
          feedback: "已追加打赏",
          error: ""
        });
        return;
      }

      await addRankingReward(this.data.task.id, submissionId);
      const submissions = await listTaskSubmissions(this.data.task.id);
      this.setData({
        cards: submissions.map(mapReviewCard),
        feedback: "已发放排名奖",
        error: ""
      });
    } catch (error) {
      this.setData({
        error: error.message || "审核动作失败",
        feedback: ""
      });
    }
  }
});

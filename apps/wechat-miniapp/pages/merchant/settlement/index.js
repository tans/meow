import { settleMerchantTask, listTaskSubmissions } from "../../../src/services/submissions.js";
import { getSelectedTask } from "../../../src/services/tasks.js";
import { buildSettlementSummary } from "../../../src/view-models/review.js";

Page({
  data: {
    title: "任务结算",
    summary: "原生商家页：释放奖励并退回未使用预算。",
    task: null,
    settlement: null,
    result: "",
    error: ""
  },

  async onShow() {
    const task = await getSelectedTask();
    const submissions = task ? await listTaskSubmissions(task.id) : [];

    this.setData({
      task,
      settlement: buildSettlementSummary(task, submissions),
      result: "",
      error: ""
    });
  },

  async onSettleTap() {
    try {
      const response = await settleMerchantTask(this.data.task.id);
      const refreshedTask = await getSelectedTask();
      const submissions = refreshedTask
        ? await listTaskSubmissions(refreshedTask.id)
        : [];
      this.setData({
        task: refreshedTask,
        settlement: {
          ...buildSettlementSummary(refreshedTask, submissions),
          rewardPreview: [
            `创作者可提现 +${response.creatorAvailableDelta}`,
            `商家退款 +${response.merchantRefundDelta}`
          ]
        },
        result: `任务 ${response.taskId} 已结算`,
        error: ""
      });
    } catch (error) {
      this.setData({
        error: error.message || "结算失败",
        result: ""
      });
    }
  }
});

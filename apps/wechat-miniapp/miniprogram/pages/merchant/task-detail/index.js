import {
  getLatestMerchantTask,
  getMerchantTaskDetail,
  setSelectedTaskId
} from "../../../../src/services/tasks.js";

Page({
  data: {
    title: "任务详情",
    summary: "原生商家页：查看任务状态、投稿和预算消耗。",
    task: null,
    error: ""
  },

  async onShow() {
    try {
      const latestTask = await getLatestMerchantTask();
      const task = latestTask?.id
        ? await getMerchantTaskDetail(latestTask.id)
        : null;

      this.setData({
        task,
        error: ""
      });
    } catch (error) {
      this.setData({
        task: null,
        error: error.message || "任务详情加载失败"
      });
    }
  },

  onOpenReview() {
    if (this.data.task?.id) {
      setSelectedTaskId(this.data.task.id);
    }

    wx.navigateTo({ url: "/pages/merchant/review/index" });
  },

  onOpenSettlement() {
    if (this.data.task?.id) {
      setSelectedTaskId(this.data.task.id);
    }

    wx.navigateTo({ url: "/pages/merchant/settlement/index" });
  }
});

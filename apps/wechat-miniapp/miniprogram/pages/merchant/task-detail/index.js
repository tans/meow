import { getLatestMerchantTask, setSelectedTaskId } from "../../../../src/services/tasks.js";

Page({
  data: {
    title: "任务详情",
    summary: "原生商家页：查看任务状态、投稿和预算消耗。",
    task: null
  },

  onShow() {
    const task = getLatestMerchantTask();
    this.setData({
      task
    });
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

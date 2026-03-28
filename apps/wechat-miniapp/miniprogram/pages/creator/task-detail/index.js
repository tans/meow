import { getSelectedTask, setSelectedTaskId } from "../../../../src/services/tasks.js";

Page({
  data: {
    title: "任务详情",
    summary: "原生创作者页：查看任务要求并准备投稿。",
    task: null
  },

  onLoad(query) {
    if (query?.taskId) {
      setSelectedTaskId(query.taskId);
    }
  },

  async onShow() {
    const task = await getSelectedTask();

    this.setData({
      task
    });
  },

  onSubmitTap() {
    wx.navigateTo({ url: "/pages/creator/submission-edit/index" });
  }
});

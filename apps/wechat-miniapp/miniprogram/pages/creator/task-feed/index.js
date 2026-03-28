import { listPublicTasks, setSelectedTaskId } from "../../../../src/services/tasks.js";
import { mapTaskCard } from "../../../../src/view-models/task-feed.js";

Page({
  data: {
    title: "任务池",
    summary: "原生创作者页：浏览公开任务和奖励规则。",
    cards: [],
    error: ""
  },

  async onShow() {
    try {
      const tasks = await listPublicTasks();
      this.setData({
        cards: tasks.map(mapTaskCard),
        error: ""
      });
    } catch (error) {
      this.setData({
        cards: [],
        error: error.message || "任务池加载失败"
      });
    }
  },

  onCardTap(event) {
    const { taskId } = event.currentTarget.dataset;
    setSelectedTaskId(taskId);
    wx.navigateTo({ url: `/pages/creator/task-detail/index?taskId=${taskId}` });
  }
});

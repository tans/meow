import { listPublicTasks, setSelectedTaskId } from "../../src/services/tasks.js";
import { mapTaskCard } from "../../src/view-models/task-feed.js";
import { buildLobbyModel } from "../../src/view-models/workspace.js";

Page({
  data: {
    title: "",
    heroText: "",
    heroSubtext: "",
    activeChannel: "推荐",
    channels: [],
    cards: [],
    error: ""
  },

  async onShow() {
    await this.loadPage(this.data.activeChannel || "推荐");
  },

  async onChannelTap(event) {
    const { value } = event.currentTarget.dataset;

    if (!value || value === this.data.activeChannel) {
      return;
    }

    await this.loadPage(value);
  },

  async onPullDownRefresh() {
    await this.loadPage(this.data.activeChannel || "推荐");
    wx.stopPullDownRefresh();
  },

  async loadPage(activeChannel) {
    const lobby = buildLobbyModel(activeChannel);

    try {
      const tasks = await listPublicTasks();
      this.setData({
        title: lobby.title,
        heroText: lobby.heroText,
        heroSubtext: lobby.heroSubtext,
        activeChannel,
        channels: lobby.channels,
        cards: tasks.map(mapTaskCard),
        error: ""
      });
    } catch (error) {
      this.setData({
        title: lobby.title,
        heroText: lobby.heroText,
        heroSubtext: lobby.heroSubtext,
        activeChannel,
        channels: lobby.channels,
        cards: [],
        error: error.message || "悬赏大厅加载失败"
      });
    }
  },

  onCardTap(event) {
    const { taskId } = event.currentTarget.dataset;

    if (!taskId) {
      return;
    }

    setSelectedTaskId(taskId);
    wx.navigateTo({ url: `/pages/creator/task-detail/index?taskId=${taskId}` });
  }
});

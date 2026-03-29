import { getAppRole } from "../../src/services/role.js";
import { buildTaskListModel } from "../../src/view-models/workspace.js";

Page({
  data: {
    title: "",
    subtitle: "",
    entries: []
  },

  onShow() {
    const role = getAppRole();
    const model = buildTaskListModel(role);

    this.setData({
      title: model.title,
      subtitle: model.subtitle,
      entries: model.entries
    });
  },

  onOpenEntry(event) {
    const { path } = event.currentTarget.dataset;

    if (!path) {
      return;
    }

    wx.navigateTo({ url: path });
  }
});

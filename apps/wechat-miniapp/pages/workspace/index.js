import { getAppRole } from "../../src/services/role.js";
import { buildWorkspaceModel } from "../../src/view-models/workspace.js";

Page({
  data: {
    role: "creator",
    title: "",
    subtitle: "",
    primaryAction: "",
    stats: []
  },

  onShow() {
    const role = getAppRole();
    const model = buildWorkspaceModel(role);

    this.setData({
      role,
      title: model.title,
      subtitle: model.subtitle,
      primaryAction: model.primaryAction,
      stats: model.stats
    });
  }
});

import { getAppRole } from "../../../src/services/role.js";
import { buildWalletModel } from "../../../src/view-models/workspace.js";

Page({
  data: {
    title: "",
    summary: "",
    highlights: []
  },

  onShow() {
    const role = getAppRole();
    const model = buildWalletModel(role);

    this.setData({
      title: model.title,
      summary: model.summary,
      highlights: model.highlights
    });
  }
});

import { getAppRole, setAppRole } from "../../src/services/role.js";
import { buildProfileModel } from "../../src/view-models/workspace.js";

Page({
  data: {
    currentRole: "creator",
    title: "",
    creatorName: "",
    creatorBio: "",
    creatorTags: [],
    creatorStatus: "",
    stats: [],
    quickLinks: [],
    merchantEntry: null
  },

  onShow() {
    this.loadPage();
  },

  onQuickLinkTap(event) {
    const { path } = event.currentTarget.dataset;

    if (!path) {
      return;
    }

    wx.navigateTo({ url: path });
  },

  onMerchantEntryTap() {
    setAppRole("merchant");
    wx.navigateTo({ url: "/pages/merchant/task-create/index" });
  },

  loadPage() {
    const role = getAppRole();
    const model = buildProfileModel(role);

    this.setData({
      currentRole: role,
      title: model.title,
      creatorName: model.creatorName,
      creatorBio: model.creatorBio,
      creatorTags: model.creatorTags,
      creatorStatus: model.creatorStatus,
      stats: model.stats,
      quickLinks: model.quickLinks,
      merchantEntry: model.merchantEntry
    });
  }
});

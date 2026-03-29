import { getAppRole, switchAppRole } from "../../../src/services/role.js";
import { buildProfileModel } from "../../../src/view-models/workspace.js";

Page({
  data: {
    currentRole: "creator",
    title: "",
    subtitle: "",
    roleCards: []
  },

  onShow() {
    const role = getAppRole();
    const model = buildProfileModel(role);

    this.setData({
      currentRole: role,
      title: model.title,
      subtitle: model.subtitle,
      roleCards: model.roleCards
    });
  },

  async onRoleTap(event) {
    const { role } = event.currentTarget.dataset;

    if (!role || role === this.data.currentRole) {
      return;
    }

    await switchAppRole(role);
    const model = buildProfileModel(getAppRole());

    this.setData({
      currentRole: getAppRole(),
      "roleCards[0].active": model.roleCards[0].active,
      "roleCards[1].active": model.roleCards[1].active
    });

    wx.switchTab({ url: "/pages/workspace/index" });
  }
});

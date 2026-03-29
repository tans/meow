import { getAppRole, setAppRole } from "../../src/services/role.js";
import { buildProfileModel } from "../../src/view-models/workspace.js";

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

  onRoleTap(event) {
    const { role } = event.currentTarget.dataset;

    if (!role || role === this.data.currentRole) {
      return;
    }

    setAppRole(role);
    const model = buildProfileModel(role);

    this.setData({
      currentRole: role,
      "roleCards[0].active": model.roleCards[0].active,
      "roleCards[1].active": model.roleCards[1].active
    });

    wx.switchTab({ url: "/pages/workspace/index" });
  }
});

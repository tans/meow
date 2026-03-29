import { getAppRole } from "../../src/services/role.js";
import { getWalletSnapshot } from "../../src/services/wallet.js";
import { buildEarningsModel } from "../../src/view-models/earnings.js";

Page({
  data: {
    title: "",
    summary: "",
    cards: [],
    error: ""
  },

  async onShow() {
    try {
      const role = getAppRole();
      const snapshot = await getWalletSnapshot(role);
      const model = buildEarningsModel(snapshot);

      this.setData({
        title: model.title,
        summary: model.summary,
        cards: model.cards,
        error: ""
      });
    } catch (error) {
      this.setData({
        cards: [],
        error: error.message || "资金视图加载失败"
      });
    }
  }
});

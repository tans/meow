import { getWalletSnapshot } from "../../src/services/wallet.js";
import { buildEarningsModel } from "../../src/view-models/earnings.js";
import { buildWalletEntryModel } from "../../src/view-models/workspace.js";

Page({
  data: {
    title: "",
    summary: "",
    cards: [],
    error: ""
  },

  async onShow() {
    const copy = buildWalletEntryModel();

    try {
      const snapshot = await getWalletSnapshot("creator");
      const model = buildEarningsModel(snapshot);

      this.setData({
        title: copy.title,
        summary: copy.summary,
        cards: model.cards,
        error: ""
      });
    } catch (error) {
      this.setData({
        title: copy.title,
        summary: copy.summary,
        cards: [],
        error: error.message || "收益明细加载失败"
      });
    }
  }
});

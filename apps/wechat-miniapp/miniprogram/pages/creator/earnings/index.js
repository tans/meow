import { getWalletSnapshot } from "../../../../src/services/wallet.js";
import { buildEarningsModel } from "../../../../src/view-models/earnings.js";

Page({
  data: {
    title: "收益",
    summary: "原生创作者页：查看冻结收益与可提现金额。",
    cards: []
  },

  async onShow() {
    const snapshot = await getWalletSnapshot("creator");
    const model = buildEarningsModel(snapshot);

    this.setData({
      title: model.title,
      summary: model.summary,
      cards: model.cards
    });
  }
});

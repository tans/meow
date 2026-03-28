import { getStore } from "./store.js";

export const getWalletSnapshot = async (role) => {
  const store = getStore();

  if (role === "merchant") {
    return {
      title: "商家资金视图",
      summary: "预算托管、退款和打赏支出在原生页直接查看。",
      metrics: [
        { label: "托管中", value: `¥${store.wallet.merchant.escrow}` },
        { label: "待退款", value: `¥${store.wallet.merchant.refundPending}` },
        { label: "追加打赏", value: `¥${store.wallet.merchant.tipSpend}` }
      ]
    };
  }

  return {
    title: "创作者收益视图",
    summary: "冻结收益和可提现收益来自同一条原生交易链。",
    metrics: [
      { label: "冻结收益", value: `¥${store.wallet.creator.frozen}` },
      { label: "可提现", value: `¥${store.wallet.creator.available}` },
      { label: "本周新增投稿", value: `${store.wallet.creator.weeklyAdded}` }
    ]
  };
};

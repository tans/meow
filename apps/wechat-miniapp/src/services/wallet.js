import { request } from "./http.js";

const getApiBaseUrl = () => {
  const app = getApp();
  return app.globalData.apiBaseUrl;
};

export const getWalletSnapshot = async (role) => {
  if (role === "merchant") {
    const snapshot = await request({
      url: `${getApiBaseUrl()}/merchant/wallet`,
      method: "GET",
      header: {
        "content-type": "application/json"
      }
    });

    return {
      title: "商家资金视图",
      summary: "预算托管、退款和打赏支出在原生页直接查看。",
      metrics: [
        { label: "托管中", value: `¥${snapshot.escrowAmount}` },
        { label: "待退款", value: `¥${snapshot.refundableAmount}` },
        { label: "追加打赏", value: `¥${snapshot.tipSpentAmount}` }
      ]
    };
  }

  const snapshot = await request({
    url: `${getApiBaseUrl()}/creator/wallet`,
    method: "GET",
    header: {
      "content-type": "application/json"
    }
  });

  return {
    title: "创作者收益视图",
    summary: "冻结收益和可提现收益来自同一条原生交易链。",
    metrics: [
      { label: "冻结收益", value: `¥${snapshot.frozenAmount}` },
      { label: "可提现", value: `¥${snapshot.availableAmount}` },
      { label: "累计投稿", value: `${snapshot.submissionCount}` }
    ]
  };
};

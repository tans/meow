import { createMerchantTaskDraft, publishMerchantTask } from "../../../../src/services/tasks.js";
import { buildBudgetSummary } from "../../../../src/view-models/task-create.js";

Page({
  data: {
    title: "发布任务",
    summary: "原生商家页：配置任务信息、奖励预算和投稿限制。",
    form: {
      title: "春季短视频征稿",
      baseAmount: 1,
      baseCount: 2,
      rankingTotal: 1
    },
    budgetSummary: buildBudgetSummary({
      baseAmount: 1,
      baseCount: 2,
      rankingTotal: 1
    }),
    publishStatus: "",
    loading: false,
    error: ""
  },

  onFieldInput(event) {
    const { field } = event.currentTarget.dataset;
    const rawValue = event.detail.value;
    const nextValue =
      field === "title" ? rawValue : Number(rawValue || 0);
    const nextForm = {
      ...this.data.form,
      [field]: nextValue
    };
    const summary = buildBudgetSummary(nextForm);

    this.setData({
      [`form.${field}`]: nextValue,
      "budgetSummary.lockedTotal": summary.lockedTotal,
      error: ""
    });
  },

  async onPublishTap() {
    this.setData({ loading: true, error: "", publishStatus: "" });

    try {
      const draft = await createMerchantTaskDraft(this.data.form);
      const published = await publishMerchantTask(draft.id);

      this.setData({
        loading: false,
        publishStatus: `任务 ${published.id} 已发布，已锁定预算 ${this.data.budgetSummary.lockedTotal}`
      });
    } catch (error) {
      this.setData({
        loading: false,
        error: error.message || "发布失败，请确认 API 已启动"
      });
    }
  }
});

import { createCreatorSubmission } from "../../../../src/services/submissions.js";
import { getSelectedTask } from "../../../../src/services/tasks.js";

Page({
  data: {
    title: "编辑投稿",
    summary: "原生创作者页：提交素材链接和文字说明。",
    task: null,
    form: {
      assetUrl: "https://example.com/demo.mp4",
      description: "原生小程序投稿示例"
    },
    result: "",
    error: ""
  },

  async onShow() {
    const task = await getSelectedTask();
    this.setData({
      task
    });
  },

  onFieldInput(event) {
    const { field } = event.currentTarget.dataset;

    this.setData({
      [`form.${field}`]: event.detail.value,
      error: "",
      result: ""
    });
  },

  async onSubmitTap() {
    try {
      const response = await createCreatorSubmission(this.data.task.id, this.data.form);
      this.setData({
        result: `投稿 ${response.id} 已提交，等待商家审核`,
        error: ""
      });
    } catch (error) {
      this.setData({
        error: error.message || "投稿失败",
        result: ""
      });
    }
  }
});

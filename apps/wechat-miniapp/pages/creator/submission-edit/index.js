import {
  createCreatorSubmission,
  getCreatorTaskSubmission,
  updateCreatorSubmission
} from "../../../src/services/submissions.js";
import {
  getCreatorTaskDetail,
  getSelectedTaskId
} from "../../../src/services/tasks.js";

Page({
  data: {
    title: "编辑投稿",
    summary: "原生创作者页：提交素材链接和文字说明。",
    task: null,
    submissionId: "",
    submitLabel: "提交作品",
    form: {
      assetUrl: "https://example.com/demo.mp4",
      description: "原生小程序投稿示例"
    },
    result: "",
    error: ""
  },

  onLoad(query) {
    this.setData({
      submissionId: query?.submissionId || ""
    });
  },

  async onShow() {
    try {
      const taskId = getSelectedTaskId();
      const task = taskId ? await getCreatorTaskDetail(taskId) : null;
      const submission = task && this.data.submissionId
        ? await getCreatorTaskSubmission(taskId, this.data.submissionId)
        : null;

      if (this.data.submissionId && !submission) {
        this.setData({
          task,
          submitLabel: "保存修改",
          error: "投稿不存在"
        });
        return;
      }

      this.setData({
        task,
        submitLabel: submission ? "保存修改" : "提交作品",
        form: submission
          ? {
              assetUrl: submission.assetUrl,
              description: submission.description
            }
          : this.data.form,
        error: task ? "" : "请先从任务池选择任务。"
      });
    } catch (error) {
      this.setData({
        task: null,
        error: error.message || "任务信息加载失败"
      });
    }
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
    if (!this.data.task) {
      this.setData({
        error: "请先从任务池选择任务。",
        result: ""
      });
      return;
    }

    if (!this.data.task.canSubmit) {
      this.setData({
        error: "当前任务不可投稿",
        result: ""
      });
      return;
    }

    try {
      if (this.data.submissionId) {
        await updateCreatorSubmission(this.data.submissionId, this.data.form);
      } else {
        await createCreatorSubmission(this.data.task.id, this.data.form);
      }

      wx.showToast({
        title: this.data.submissionId ? "投稿已更新" : "投稿已提交",
        icon: "success"
      });
      wx.navigateBack({ delta: 1 });
    } catch (error) {
      this.setData({
        error: error.message || "投稿失败",
        result: ""
      });
    }
  }
});

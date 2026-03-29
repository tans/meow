import {
  getCreatorTaskDetail,
  getSelectedTaskId,
  setSelectedTaskId
} from "../../../../src/services/tasks.js";
import {
  listCreatorTaskSubmissions,
  withdrawCreatorSubmission
} from "../../../../src/services/submissions.js";
import { mapCreatorSubmissionCard } from "../../../../src/view-models/review.js";

const loadPageModel = async (taskId) => {
  const [task, submissions] = taskId
    ? await Promise.all([
        getCreatorTaskDetail(taskId),
        listCreatorTaskSubmissions(taskId)
      ])
    : [null, []];

  return {
    task,
    submissionCards: submissions.map(mapCreatorSubmissionCard)
  };
};

Page({
  data: {
    title: "任务详情",
    summary: "原生创作者页：查看任务要求并准备投稿。",
    task: null,
    submissionCards: [],
    feedback: "",
    error: ""
  },

  onLoad(query) {
    if (query?.taskId) {
      setSelectedTaskId(query.taskId);
    }
  },

  async onShow() {
    try {
      const taskId = getSelectedTaskId();
      const model = await loadPageModel(taskId);

      this.setData({
        task: model.task,
        submissionCards: model.submissionCards,
        feedback: "",
        error: ""
      });
    } catch (error) {
      this.setData({
        task: null,
        submissionCards: [],
        feedback: "",
        error: error.message || "任务详情加载失败"
      });
    }
  },

  onSubmitTap() {
    if (!this.data.task?.canSubmit) {
      return;
    }

    wx.navigateTo({ url: "/pages/creator/submission-edit/index" });
  },

  onEditTap(event) {
    const { submissionId } = event.currentTarget.dataset;

    if (!submissionId) {
      return;
    }

    wx.navigateTo({
      url: `/pages/creator/submission-edit/index?submissionId=${submissionId}`
    });
  },

  async onWithdrawTap(event) {
    const { submissionId } = event.currentTarget.dataset;

    if (!submissionId) {
      return;
    }

    try {
      await withdrawCreatorSubmission(submissionId);
      const model = await loadPageModel(getSelectedTaskId());

      this.setData({
        task: model.task,
        submissionCards: model.submissionCards,
        feedback: "投稿已撤回",
        error: ""
      });
    } catch (error) {
      this.setData({
        feedback: "",
        error: error.message || "撤回失败"
      });
    }
  }
});

import { buildAwardsModel } from "../../src/view-models/workspace.js";

Page({
  data: {
    title: "",
    featuredTitle: "",
    featuredDescription: "",
    periods: [],
    categories: [],
    featuredCards: [],
    activePeriod: "本周",
    activeCategory: "全部"
  },

  onShow() {
    this.loadPage(this.data.activePeriod, this.data.activeCategory);
  },

  onPeriodTap(event) {
    const { value } = event.currentTarget.dataset;
    this.loadPage(value || "本周", this.data.activeCategory);
  },

  onCategoryTap(event) {
    const { value } = event.currentTarget.dataset;
    this.loadPage(this.data.activePeriod, value || "全部");
  },

  loadPage(activePeriod, activeCategory) {
    const model = buildAwardsModel(activePeriod, activeCategory);

    this.setData({
      title: model.title,
      featuredTitle: model.featuredTitle,
      featuredDescription: model.featuredDescription,
      periods: model.periods,
      categories: model.categories,
      featuredCards: model.featuredCards,
      activePeriod,
      activeCategory
    });
  }
});

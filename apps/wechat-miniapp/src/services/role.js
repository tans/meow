export const getAppRole = () => {
  const app = getApp();
  return app.globalData.activeRole || "creator";
};

export const setAppRole = (role) => {
  const app = getApp();
  app.globalData.activeRole = role;
  return app.globalData.activeRole;
};

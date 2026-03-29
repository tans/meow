import { bootstrapAppSession } from "../src/services/role.js";

App({
  globalData: {
    activeRole: "creator",
    apiBaseUrl: "http://127.0.0.1:3000",
    demoState: null,
    session: null,
    roleService: null,
    bootstrapError: ""
  },

  async onLaunch() {
    try {
      await bootstrapAppSession();
    } catch (error) {
      this.globalData.bootstrapError = error?.message || "session bootstrap failed";
    }
  }
});

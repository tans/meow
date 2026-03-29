import { request } from "./http.js";
import { getSessionState, setSessionState } from "./store.js";

const getApiBaseUrl = () => {
  const app = getApp();
  return app.globalData.apiBaseUrl;
};

const readApp = () => {
  const app = getApp();
  app.globalData = app.globalData || {};
  return app;
};

const syncSession = (session) => {
  const app = readApp();
  app.globalData.session = session;
  app.globalData.activeRole = session?.activeRole || app.globalData.activeRole || "creator";
  setSessionState(session);
  return session;
};

const isMissingSessionError = (error) => {
  const message = error?.message || "";
  return message.includes("missing session") || message.includes("invalid session");
};

const createRoleApi = () => ({
  async loginDemo() {
    return await request({
      url: `${getApiBaseUrl()}/auth/login`,
      method: "POST",
      data: {
        identifier: "hybrid@example.com",
        secret: "demo-pass",
        client: "miniapp"
      },
      header: {
        "content-type": "application/json"
      }
    });
  },

  async getSession() {
    try {
      return await request({
        url: `${getApiBaseUrl()}/auth/session`,
        method: "GET",
        header: {
          "content-type": "application/json"
        }
      });
    } catch (error) {
      if (isMissingSessionError(error)) {
        return null;
      }

      throw error;
    }
  },

  async switchRole(role) {
    return await request({
      url: `${getApiBaseUrl()}/auth/switch-role`,
      method: "POST",
      data: { role },
      header: {
        "content-type": "application/json"
      }
    });
  }
});

export const createRoleService = (api) => ({
  async loadSession() {
    return await api.getSession();
  },

  async ensureSession() {
    const session = await api.getSession();

    if (session) {
      return session;
    }

    if (typeof api.loginDemo !== "function") {
      return null;
    }

    return await api.loginDemo();
  },

  async switchRole(role) {
    return await api.switchRole(role);
  }
});

export const bootstrapAppSession = async () => {
  const app = readApp();
  const roleService = app.globalData.roleService || createRoleService(createRoleApi());
  app.globalData.roleService = roleService;

  const session = await roleService.ensureSession();
  return syncSession(session);
};

export const getAppRole = () => {
  const app = readApp();
  return (
    app.globalData.session?.activeRole ||
    getSessionState()?.activeRole ||
    app.globalData.activeRole ||
    "creator"
  );
};

export const setAppRole = (role) => {
  const app = readApp();
  const session = app.globalData.session || getSessionState();

  app.globalData.activeRole = role;

  if (session) {
    syncSession({
      ...session,
      activeRole: role
    });
  }

  return app.globalData.activeRole;
};

export const switchAppRole = async (role) => {
  const app = readApp();
  const roleService = app.globalData.roleService || createRoleService(createRoleApi());
  app.globalData.roleService = roleService;
  const session = await roleService.switchRole(role);

  return syncSession(session);
};

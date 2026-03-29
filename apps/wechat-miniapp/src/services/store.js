const createDefaultState = () => ({
  session: null,
  sessionCookie: "",
  selectedTaskId: "",
  latestMerchantTask: null,
  taskMetaById: {},
  submissionsByTaskId: {}
});

let fallbackState = createDefaultState();

const cloneState = () => JSON.parse(JSON.stringify(createDefaultState()));

export const getStore = () => {
  if (typeof getApp !== "function") {
    return fallbackState;
  }

  const app = getApp();
  app.globalData.demoState = app.globalData.demoState || cloneState();
  return app.globalData.demoState;
};

export const resetStore = () => {
  fallbackState = cloneState();
  return fallbackState;
};

export const getSessionState = () => getStore().session || null;

export const setSessionState = (session) => {
  const store = getStore();
  store.session = session;
  return store.session;
};

export const getSessionCookie = () => getStore().sessionCookie || "";

export const setSessionCookie = (cookieHeader) => {
  const store = getStore();
  store.sessionCookie = cookieHeader || "";
  return store.sessionCookie;
};

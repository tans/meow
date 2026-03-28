const createDefaultState = () => ({
  selectedTaskId: "",
  latestMerchantTask: null,
  taskMetaById: {},
  submissionsByTaskId: {},
  wallet: {
    merchant: {
      escrow: 0,
      refundPending: 0,
      tipSpend: 0
    },
    creator: {
      frozen: 0,
      available: 0,
      weeklyAdded: 0
    }
  }
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

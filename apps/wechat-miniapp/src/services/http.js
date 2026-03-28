const ensureWechatRuntime = () => {
  if (typeof wx === "undefined") {
    throw new Error("wechat runtime unavailable");
  }
};

export const request = ({ url, method = "GET", data, header }) => {
  ensureWechatRuntime();

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header,
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }

        reject(new Error(response.data?.error || "request failed"));
      },
      fail: (error) => reject(error)
    });
  });
};

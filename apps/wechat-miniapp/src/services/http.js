const ensureWechatRuntime = () => {
  if (typeof wx === "undefined") {
    throw new Error("wechat runtime unavailable");
  }
};

import { getSessionCookie, setSessionCookie } from "./store.js";

const toCookieHeader = (setCookieHeader) =>
  setCookieHeader
    .split(/,(?=[^;]+=[^;]+)/)
    .map((cookie) => cookie.split(";")[0]?.trim() || "")
    .filter((cookie) => cookie)
    .join("; ");

const readCookieHeader = (response) =>
  response?.header?.["Set-Cookie"] ||
  response?.header?.["set-cookie"] ||
  (Array.isArray(response?.cookies) ? response.cookies.join(",") : "");

export const createHttpClient = (storage = {
  get(key) {
    return key === "sessionCookie" ? getSessionCookie() : "";
  },
  set(key, value) {
    if (key === "sessionCookie") {
      return setSessionCookie(value);
    }

    return value;
  }
}) => ({ url, method = "GET", data, header }) => {
  ensureWechatRuntime();
  const sessionCookie = storage.get("sessionCookie");

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header: {
        ...header,
        ...(sessionCookie ? { cookie: sessionCookie } : {})
      },
      success: (response) => {
        const cookieHeader = toCookieHeader(readCookieHeader(response) || "");

        if (cookieHeader) {
          storage.set("sessionCookie", cookieHeader);
        }

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

export const request = createHttpClient();

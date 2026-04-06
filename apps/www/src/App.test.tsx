import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App footer", () => {
  it("renders admin and square entry links", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('href="https://miao.ali.minapp.xin/admin"');
    expect(html).toContain("管理后台");
    expect(html).toContain('href="https://miao.ali.minapp.xin/square"');
    expect(html).toContain("任务广场");
  });
});

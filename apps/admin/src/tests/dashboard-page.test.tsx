import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "../routes/DashboardPage.js";

describe("DashboardPage", () => {
  it("renders operator metrics from the admin api model", () => {
    render(
      <DashboardPage
        snapshot={{
          title: "系统总览",
          summary: "围绕任务审核、资金流转和风险动作的单日总览。",
          metrics: [{ label: "待治理任务", value: "12", trend: "较昨日 +1" }],
          alerts: [{ title: "存在人工暂停任务", detail: "task-1 需要复核" }]
        }}
      />
    );

    expect(screen.getByText("系统总览")).toBeInTheDocument();
    expect(screen.getByText("待治理任务")).toBeInTheDocument();
    expect(screen.getByText("存在人工暂停任务")).toBeInTheDocument();
  });
});

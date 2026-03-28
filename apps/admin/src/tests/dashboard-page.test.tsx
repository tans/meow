import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "../routes/DashboardPage.js";

describe("DashboardPage", () => {
  it("shows the operator overview cards", () => {
    render(<DashboardPage />);

    expect(screen.getByText("系统总览")).toBeInTheDocument();
    expect(screen.getByText("待审核任务")).toBeInTheDocument();
    expect(screen.getByText("资金结算进度")).toBeInTheDocument();
  });
});

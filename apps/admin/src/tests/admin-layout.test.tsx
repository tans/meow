import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminLayout } from "../components/AdminLayout.js";

describe("AdminLayout", () => {
  it("renders the sidebar items from the MVP spec", () => {
    render(
      <AdminLayout>
        <div>body</div>
      </AdminLayout>
    );

    expect(screen.getByText("系统总览")).toBeInTheDocument();
    expect(screen.getByText("任务管理")).toBeInTheDocument();
    expect(screen.getByText("资金管理")).toBeInTheDocument();
  });
});

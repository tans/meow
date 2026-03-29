import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../routes/LoginPage.js";

describe("admin login page", () => {
  it("submits operator demo credentials", () => {
    const onSubmit = vi.fn();

    render(<LoginPage onSubmit={onSubmit} loading={false} />);

    screen.getByRole("button", { name: "进入后台" }).click();

    expect(onSubmit).toHaveBeenCalledWith({
      identifier: "operator@example.com",
      secret: "demo-pass",
      client: "admin"
    });
  });
});

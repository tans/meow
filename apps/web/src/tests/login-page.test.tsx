import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../routes/LoginPage.js";

describe("login page", () => {
  it("submits demo credentials", () => {
    const onSubmit = vi.fn();

    render(<LoginPage loading={false} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("账号"), {
      target: { value: "hybrid@example.com" }
    });
    fireEvent.change(screen.getByLabelText("口令"), {
      target: { value: "demo-pass" }
    });
    fireEvent.click(screen.getByRole("button", { name: "进入创意喵" }));

    expect(onSubmit).toHaveBeenCalledWith({
      identifier: "hybrid@example.com",
      secret: "demo-pass",
      client: "web"
    });
  });
});

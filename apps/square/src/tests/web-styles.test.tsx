import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App, { type WebSession } from "../App.js";
import { LoginPage } from "../routes/LoginPage.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

describe("web visual structure", () => {
  it("renders the login surface with Card component", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <LoginPage loading={false} onSubmit={onSubmit} />
    );
    // Check for login-screen section
    expect(container.querySelector(".login-screen")).toBeTruthy();
    // Check for Card component
    expect(container.querySelector("[data-slot='card']")).toBeTruthy();
    // Check for heading
    expect(
      screen.getByRole("heading", { name: "登录创意喵" })
    ).toBeTruthy();
    // Check for submit button with Button component
    const button = screen.getByRole("button", { name: "进入创意喵" });
    expect(button).toBeTruthy();
    expect(button.tagName).toBe("BUTTON");
  });

  it("renders the authenticated shell with mobile layout", () => {
    const session: WebSession = {
      user: { id: "hybrid-1", displayName: "Demo Hybrid" },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    };
    const { container } = render(
      <MemoryRouter>
        <App session={session} />
      </MemoryRouter>
    );
    // Check for mobile layout
    expect(container.querySelector(".min-h-screen")).toBeTruthy();
    // Check for tab navigation by role
    expect(
      screen.getByRole("tablist")
    ).toBeTruthy();
    // Check for heading
    expect(
      screen.getByRole("heading", { name: "悬赏大厅" })
    ).toBeTruthy();
  });

  it("Button component renders with correct structure", () => {
    const { container } = render(<Button>Test</Button>);
    expect(container.querySelector("button")).toBeTruthy();
  });

  it("Card component renders with correct structure", () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.querySelector("[data-slot='card']")).toBeTruthy();
  });
});

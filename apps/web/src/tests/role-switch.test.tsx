import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoleSwitch } from "../components/RoleSwitch.js";

describe("role switch", () => {
  it("requests a role switch and updates the active label", () => {
    const onSwitch = vi.fn();

    render(
      <RoleSwitch
        roles={["creator", "merchant"]}
        activeRole="creator"
        onSwitch={onSwitch}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "切换到商家" }));
    expect(onSwitch).toHaveBeenCalledWith("merchant");
  });
});

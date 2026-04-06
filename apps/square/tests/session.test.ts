import { describe, expect, it } from "vitest";
import type { AuthSessionPayload, LoginResponse } from "@meow/contracts";
import {
  defaultPathForRole,
  isCreatorTabPath,
  normalizeWebSession,
  type WebUser
} from "../src/lib/session.js";

describe("session helpers", () => {
  it("isCreatorTabPath returns true for creator tabs and false for merchant paths", () => {
    expect(isCreatorTabPath("/tasks")).toBe(true);
    expect(isCreatorTabPath("/workspace")).toBe(true);
    expect(isCreatorTabPath("/profile")).toBe(true);
    expect(isCreatorTabPath("/merchant/task-create")).toBe(false);
  });

  it("defaultPathForRole returns the expected default route", () => {
    expect(defaultPathForRole("creator")).toBe("/tasks");
    expect(defaultPathForRole("merchant")).toBe("/merchant/task-create");
  });

  it("normalizeWebSession maps a standard session payload", () => {
    const payload: AuthSessionPayload = {
      sessionId: "session-1",
      userId: "creator-1",
      activeRole: "creator",
      roles: ["creator", "merchant"]
    };
    const fallbackUser: WebUser = {
      id: "creator-1",
      displayName: "Demo Creator"
    };

    expect(normalizeWebSession(payload, fallbackUser)).toEqual({
      user: fallbackUser,
      activeRole: "creator",
      roles: ["creator", "merchant"]
    });
  });

  it("normalizeWebSession preserves LoginResponse user data", () => {
    const payload: LoginResponse = {
      sessionId: "session-2",
      userId: "merchant-1",
      activeRole: "merchant",
      roles: ["merchant", "operator", "creator"],
      user: {
        id: "merchant-1",
        displayName: "Demo Merchant"
      }
    };

    expect(normalizeWebSession(payload)).toEqual({
      user: {
        id: "merchant-1",
        displayName: "Demo Merchant"
      },
      activeRole: "merchant",
      roles: ["merchant", "creator"]
    });
  });

  it("normalizeWebSession throws when no creator or merchant role is available", () => {
    const payload: AuthSessionPayload = {
      sessionId: "session-3",
      userId: "operator-1",
      activeRole: "operator",
      roles: ["operator"]
    };

    expect(() => normalizeWebSession(payload)).toThrow(
      "web session requires creator or merchant role"
    );
  });

  it("normalizeWebSession filters invalid roles and falls back activeRole to the first web role", () => {
    const payload: AuthSessionPayload = {
      sessionId: "session-4",
      userId: "hybrid-1",
      activeRole: "operator",
      roles: ["operator", "creator", "merchant"]
    };

    expect(normalizeWebSession(payload)).toEqual({
      user: {
        id: "hybrid-1",
        displayName: "hybrid-1"
      },
      activeRole: "creator",
      roles: ["creator", "merchant"]
    });
  });
});

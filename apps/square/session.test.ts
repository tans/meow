import { describe, expect, it } from "vitest";
import {
  CREATOR_TAB_PATHS,
  defaultPathForRole,
  isCreatorTabPath,
  normalizeWebSession,
} from "./src/lib/session.js";
import type { AppRole } from "@meow/contracts";

describe("session: path helpers", () => {
  describe("isCreatorTabPath", () => {
    it("returns true for creator tab paths", () => {
      expect(isCreatorTabPath("/tasks")).toBe(true);
      expect(isCreatorTabPath("/workspace")).toBe(true);
      expect(isCreatorTabPath("/profile")).toBe(true);
    });

    it("returns false for merchant paths", () => {
      expect(isCreatorTabPath("/merchant/task-create")).toBe(false);
      expect(isCreatorTabPath("/merchant/review/task-1")).toBe(false);
      expect(isCreatorTabPath("/merchant/settlement/task-1")).toBe(false);
    });

    it("returns false for unrelated paths", () => {
      expect(isCreatorTabPath("/")).toBe(false);
      expect(isCreatorTabPath("/creator/task-feed")).toBe(false);
      expect(isCreatorTabPath("/wallet")).toBe(false);
    });
  });

  describe("defaultPathForRole", () => {
    it("returns /tasks for creator role", () => {
      expect(defaultPathForRole("creator")).toBe("/tasks");
    });

    it("returns /merchant/task-create for merchant role", () => {
      expect(defaultPathForRole("merchant")).toBe("/merchant/task-create");
    });
  });

  describe("CREATOR_TAB_PATHS", () => {
    it("contains the three creator tab routes", () => {
      expect(CREATOR_TAB_PATHS).toEqual(["/tasks", "/workspace", "/profile"]);
    });
  });
});

describe("session: normalizeWebSession", () => {
  const mockUser = { id: "user-1", displayName: "测试用户" };

  const makePayload = (overrides: {
    sessionId?: string;
    userId?: string;
    activeRole?: AppRole;
    roles?: AppRole[];
    user?: { id: string; displayName: string };
  }) => ({
    sessionId: "sess-1",
    userId: "user-1",
    activeRole: "creator" as AppRole,
    roles: ["creator", "merchant"] as AppRole[],
    user: { id: "user-1", displayName: "测试用户" },
    ...overrides,
  });

  it("normalizes AuthSessionPayload with user field", () => {
    const payload = makePayload({});
    const session = normalizeWebSession(payload);
    expect(session.user.id).toBe("user-1");
    expect(session.user.displayName).toBe("测试用户");
    expect(session.activeRole).toBe("creator");
    expect(session.roles).toEqual(["creator", "merchant"]);
  });

  it("normalizes LoginResponse (extends AuthSessionPayload) the same way", () => {
    // LoginResponse extends AuthSessionPayload, so it has the same shape
    const payload = makePayload({}) as Parameters<typeof normalizeWebSession>[0];
    const session = normalizeWebSession(payload);
    expect(session.activeRole).toBe("creator");
  });

  it("filters out non-web roles (operator) from roles array", () => {
    const payload = makePayload({ roles: ["creator", "operator", "merchant"] });
    const session = normalizeWebSession(payload);
    expect(session.roles).toEqual(["creator", "merchant"]);
  });

  it("falls back activeRole to first web role when activeRole is operator", () => {
    const payload = makePayload({ activeRole: "operator", roles: ["creator", "merchant"] });
    const session = normalizeWebSession(payload);
    expect(session.activeRole).toBe("creator");
  });

  it("uses fallbackUser when payload has no user field (userId-only payload)", () => {
    const payload = {
      sessionId: "sess-1",
      userId: "user-id-only",
      activeRole: "creator",
      roles: ["creator"] as AppRole[],
    };
    const session = normalizeWebSession(payload, mockUser);
    expect(session.user).toEqual(mockUser);
  });

  it("derives displayName from userId when no user field and no fallback", () => {
    const payload = {
      sessionId: "sess-1",
      userId: "creator-99",
      activeRole: "creator",
      roles: ["creator"] as AppRole[],
    };
    const session = normalizeWebSession(payload);
    expect(session.user.id).toBe("creator-99");
    expect(session.user.displayName).toBe("creator-99");
  });

  it("throws when activeRole is non-web and roles filter leaves no web role", () => {
    // activeRole is "operator" (not a web role) AND roles has no web roles
    const payload = makePayload({ activeRole: "operator", roles: ["operator"] });
    expect(() => normalizeWebSession(payload)).toThrow(
      "web session requires creator or merchant role"
    );
  });

  it("throws when activeRole is operator and roles has no web role fallback", () => {
    const payload = makePayload({ activeRole: "operator", roles: ["operator"] });
    expect(() => normalizeWebSession(payload)).toThrow(
      "web session requires creator or merchant role"
    );
  });

  it("uses payload.user over fallbackUser", () => {
    const payload = makePayload({ user: { id: "payload-user", displayName: "Payload用户" } });
    const session = normalizeWebSession(payload, mockUser);
    expect(session.user.id).toBe("payload-user");
    expect(session.user.displayName).toBe("Payload用户");
  });
});

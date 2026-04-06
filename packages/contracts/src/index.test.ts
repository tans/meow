import { describe, expect, it } from "vitest";

import * as contracts from "./index.js";

type ContractsApi = typeof import("./index.js");

const api = contracts as ContractsApi;

describe("@meow/contracts", () => {
  describe("Route contracts", () => {
    it("exports routeContracts as a non-empty array", () => {
      expect(Array.isArray(api.routeContracts)).toBe(true);
      expect(api.routeContracts.length).toBeGreaterThan(0);
    });

    it("each route contract has all required fields", () => {
      for (const route of api.routeContracts) {
        expect(route).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            surface: expect.stringMatching(/^(app|admin|harness)$/),
            path: expect.stringMatching(/^\//),
            context: expect.any(String),
            permissions: expect.arrayContaining([]),
            purpose: expect.any(String),
          })
        );
      }
    });

    it("route contracts have unique ids", () => {
      const ids = api.routeContracts.map((r) => r.id);
      expect(ids).toHaveLength(new Set(ids).size);
    });

    it("covers expected bounded contexts", () => {
      const contexts = [...new Set(api.routeContracts.map((r) => r.context))];
      expect(contexts).toContain("task");
      expect(contexts).toContain("submission");
      expect(contexts).toContain("wallet");
    });

    it("merchant and creator surfaces have correct routes", () => {
      const merchantRoutes = api.routeContracts.filter(
        (r) => r.purpose.includes("商家") || r.id.includes("merchant")
      );
      const creatorRoutes = api.routeContracts.filter(
        (r) => r.purpose.includes("创作者") || r.id.includes("creator")
      );
      expect(merchantRoutes.length).toBeGreaterThan(0);
      expect(creatorRoutes.length).toBeGreaterThan(0);
    });

    it("admin routes have admin surface", () => {
      const adminRoutes = api.routeContracts.filter(
        (r) => r.surface === "admin"
      );
      expect(adminRoutes.length).toBeGreaterThan(0);
    });
  });

  describe("surfaceIds", () => {
    it("exports surfaceIds with expected values", () => {
      expect(api.surfaceIds).toEqual(
        expect.arrayContaining(["web", "wechat-miniapp", "admin", "api"])
      );
      expect(api.surfaceIds).toHaveLength(4);
    });
  });

  describe("AppRole type", () => {
    it("exports AppRole type alias", () => {
      const roles: contracts.AppRole[] = ["creator", "merchant", "operator"];
      expect(roles).toHaveLength(3);
    });
  });

  describe("AppClient type", () => {
    it("exports AppClient type alias", () => {
      const clients: contracts.AppClient[] = ["web", "miniapp", "admin"];
      expect(clients).toHaveLength(3);
    });
  });

  describe("Auth interfaces", () => {
    it("LoginRequest has required fields", () => {
      const req: contracts.LoginRequest = {
        identifier: "user@example.com",
        secret: "password123",
        client: "web",
      };
      expect(req.identifier).toBe("user@example.com");
      expect(req.client).toBe("web");
    });

    it("AuthSessionPayload has all required fields", () => {
      const session: contracts.AuthSessionPayload = {
        sessionId: "sess-1",
        userId: "user-1",
        activeRole: "creator",
        roles: ["creator"],
      };
      expect(session.activeRole).toBe("creator");
      expect(session.roles).toContain("creator");
    });

    it("LoginResponse extends AuthSessionPayload with user", () => {
      const resp: contracts.LoginResponse = {
        sessionId: "sess-1",
        userId: "user-1",
        activeRole: "merchant",
        roles: ["merchant"],
        user: { id: "user-1", displayName: "Test Merchant" },
      };
      expect(resp.user.displayName).toBe("Test Merchant");
    });
  });

  describe("Task interfaces", () => {
    it("PublishTaskResponse has expected shape", () => {
      const resp: contracts.PublishTaskResponse = {
        id: "task-1",
        merchantId: "merchant-1",
        status: "published",
        ledgerEffect: "merchant_escrow_locked",
      };
      expect(resp.status).toBe("published");
      expect(resp.ledgerEffect).toBe("merchant_escrow_locked");
    });

    it("SettleTaskResponse has expected shape", () => {
      const resp: contracts.SettleTaskResponse = {
        taskId: "task-1",
        status: "settled",
        creatorAvailableDelta: 150,
        merchantRefundDelta: 50,
      };
      expect(resp.status).toBe("settled");
      expect(resp.creatorAvailableDelta).toBe(150);
    });
  });

  describe("Submission interfaces", () => {
    it("ReviewSubmissionResponse covers approved and rejected", () => {
      const approved: contracts.ReviewSubmissionResponse = {
        submissionId: "sub-1",
        status: "approved",
        rewardType: "base",
        rewardStatus: "frozen",
      };
      expect(approved.status).toBe("approved");

      const rejected: contracts.ReviewSubmissionResponse = {
        submissionId: "sub-2",
        status: "rejected",
      };
      expect(rejected.status).toBe("rejected");
    });

    it("CreateTipResponse has expected shape", () => {
      const tip: contracts.CreateTipResponse = {
        submissionId: "sub-1",
        taskId: "task-1",
        rewardType: "tip",
        rewardStatus: "frozen",
        amount: 50,
      };
      expect(tip.rewardType).toBe("tip");
      expect(tip.amount).toBe(50);
    });
  });
});

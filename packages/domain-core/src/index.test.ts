import { describe, expect, it } from "vitest";

import * as domainCore from "./index.js";

type DomainCoreApi = typeof import("./index.js");

const api = domainCore as DomainCoreApi;

describe("@meow/domain-core", () => {
  describe("type constants", () => {
    it("exports all expected Surface values", () => {
      const surfaces: domainCore.Surface[] = ["app", "admin", "harness"];
      expect(surfaces).toHaveLength(3);
    });

    it("exports all expected Persona values", () => {
      const personas: domainCore.Persona[] = [
        "merchant",
        "creator",
        "operator",
        "risk-analyst",
        "finance-operator",
      ];
      expect(personas).toHaveLength(5);
    });

    it("exports all expected BoundedContext values", () => {
      const contexts: domainCore.BoundedContext[] = [
        "identity",
        "merchant",
        "creator",
        "task",
        "submission",
        "wallet",
        "settlement",
        "risk",
        "appeal",
        "notification",
        "analytics",
        "system",
      ];
      expect(contexts).toHaveLength(12);
    });

    it("exports all expected ProductMilestone values", () => {
      const milestones: domainCore.ProductMilestone[] = ["foundation", "mvp", "beta", "ga"];
      expect(milestones).toHaveLength(4);
    });
  });

  describe("workspaceManifest", () => {
    it("exports a non-null manifest", () => {
      expect(api.workspaceManifest).not.toBeNull();
    });

    it("apps array is non-empty", () => {
      expect(api.workspaceManifest.apps.length).toBeGreaterThan(0);
    });

    it("each app module has all required fields", () => {
      for (const app of api.workspaceManifest.apps) {
        expect(app).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            surface: expect.stringMatching(/^(app|admin|harness)$/),
            owner: expect.arrayContaining([]),
            personas: expect.arrayContaining([]),
            milestone: expect.stringMatching(/^(foundation|mvp|beta|ga)$/),
            responsibilities: expect.arrayContaining([]),
          })
        );
      }
    });

    it("packages array covers all expected domain packages", () => {
      const pkgNames = api.workspaceManifest.packages.map((p) => p.name);
      expect(pkgNames).toContain("@meow/domain-core");
      expect(pkgNames).toContain("@meow/domain-user");
      expect(pkgNames).toContain("@meow/domain-task");
      expect(pkgNames).toContain("@meow/domain-finance");
      expect(pkgNames).toContain("@meow/domain-risk");
      expect(pkgNames).toContain("@meow/contracts");
    });

    it("each package in manifest has required fields", () => {
      for (const pkg of api.workspaceManifest.packages) {
        expect(pkg).toEqual(
          expect.objectContaining({
            name: expect.any(String),
            contexts: expect.arrayContaining([]),
            responsibilities: expect.arrayContaining([]),
          })
        );
      }
    });

    it("coreFlows array contains the three critical flows", () => {
      const flowIds = api.workspaceManifest.coreFlows.map((f) => f.id);
      expect(flowIds).toContain("merchant-task-lifecycle");
      expect(flowIds).toContain("creator-earning-lifecycle");
      expect(flowIds).toContain("platform-risk-loop");
    });

    it("each coreFlow has non-empty steps", () => {
      for (const flow of api.workspaceManifest.coreFlows) {
        expect(flow.steps.length).toBeGreaterThan(0);
      }
    });

    it("each coreFlow step has all required fields", () => {
      for (const flow of api.workspaceManifest.coreFlows) {
        for (const step of flow.steps) {
          expect(step).toEqual(
            expect.objectContaining({
              id: expect.any(String),
              label: expect.any(String),
              context: expect.any(String),
              surface: expect.stringMatching(/^(app|admin|harness)$/),
              outcome: expect.any(String),
            })
          );
        }
      }
    });

    it("critical flows are marked as high criticality", () => {
      const criticalFlows = api.workspaceManifest.coreFlows.filter((f) => f.criticality === "high");
      expect(criticalFlows.length).toBeGreaterThan(0);
    });
  });

  describe("HarnessScenario type", () => {
    it("scenario id, title and personas are non-empty strings", () => {
      const scenario: domainCore.HarnessScenario = {
        id: "test-scenario",
        title: "Test Scenario",
        personas: ["merchant"],
        dependsOnContexts: ["task"],
        requiredFlows: ["merchant-task-lifecycle"],
        assertions: ["task is published"],
      };
      expect(scenario.id).toBe("test-scenario");
      expect(scenario.title).toBe("Test Scenario");
    });

    it("scenario with optional routeIds and replaySteps", () => {
      const scenario: domainCore.HarnessScenario = {
        id: "test-scenario",
        title: "Test Scenario",
        personas: ["merchant"],
        dependsOnContexts: ["task"],
        requiredFlows: ["merchant-task-lifecycle"],
        assertions: ["task is published"],
        routeIds: ["/merchant/task/publish"],
        replaySteps: ["publish", "submit", "approve", "settle"],
      };
      expect(scenario.routeIds).toHaveLength(1);
      expect(scenario.replaySteps).toHaveLength(4);
    });
  });

  describe("HarnessReplayResult type", () => {
    it("replay result structure is correct", () => {
      const result: domainCore.HarnessReplayResult = {
        scenarioId: "merchant-publish-submit-settle",
        steps: ["publish", "submit", "approve", "settle"],
        ok: true,
      };
      expect(result.scenarioId).toBe("merchant-publish-submit-settle");
      expect(result.steps).toHaveLength(4);
      expect(result.ok).toBe(true);
    });
  });
});

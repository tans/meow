import { describe, expect, it } from "vitest";

import * as domainRisk from "./index.js";

type DomainRiskApi = typeof import("./index.js");

const api = domainRisk as DomainRiskApi;

describe("@meow/domain-risk", () => {
  it("exports non-empty risk rules", () => {
    expect(api.riskRules.length).toBeGreaterThan(0);
  });

  it("ensures every risk rule has the required fields", () => {
    for (const rule of api.riskRules) {
      expect(rule).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          signal: expect.any(String),
          action: expect.any(String),
          impactsCredit: expect.any(Boolean)
        })
      );
    }
  });

  it("keeps impactsCredit values strictly boolean", () => {
    expect(api.riskRules.every((rule) => typeof rule.impactsCredit === "boolean")).toBe(true);
  });

  it("exports appeal decision types", () => {
    expect(api.appealDecisionTypes).toEqual([
      "reject",
      "support",
      "partial-support"
    ]);
  });
});

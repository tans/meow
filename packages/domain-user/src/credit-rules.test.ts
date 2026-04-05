import { describe, expect, it } from "vitest";

import * as domainUser from "./index.js";

type DomainUserApi = typeof import("./index.js");

const api = domainUser as DomainUserApi;

describe("@meow/domain-user credit rules", () => {
  it("returns the 80+ rule for scores at or above 80", () => {
    const rule = api.getCreditRuleForScore(80);

    expect(rule).toEqual({
      minScore: 80,
      maxSubmissionsPerDay: Number.POSITIVE_INFINITY,
      canSubmit: true
    });
    expect(api.canSubmit(80)).toBe(true);
    expect(api.getMaxSubmissionsForScore(80)).toBe(Number.POSITIVE_INFINITY);
    expect(api.getCreditRuleForScore(95)).toBe(rule);
  });

  it("returns the 60-79 rule for scores between rules", () => {
    expect(api.getCreditRuleForScore(79)).toEqual({
      minScore: 60,
      maxSubmissionsPerDay: 10,
      canSubmit: true
    });
    expect(api.getCreditRuleForScore(60)).toEqual({
      minScore: 60,
      maxSubmissionsPerDay: 10,
      canSubmit: true
    });
    expect(api.canSubmit(79)).toBe(true);
    expect(api.getMaxSubmissionsForScore(60)).toBe(10);
  });

  it("returns the 40-59 rule for scores between 40 and 59", () => {
    expect(api.getCreditRuleForScore(59)).toEqual({
      minScore: 40,
      maxSubmissionsPerDay: 5,
      canSubmit: true
    });
    expect(api.getCreditRuleForScore(40)).toEqual({
      minScore: 40,
      maxSubmissionsPerDay: 5,
      canSubmit: true
    });
    expect(api.canSubmit(40)).toBe(true);
    expect(api.getMaxSubmissionsForScore(59)).toBe(5);
  });

  it("returns the 0-39 rule at the lower boundary and below the lowest rule", () => {
    expect(api.getCreditRuleForScore(39)).toEqual({
      minScore: 0,
      maxSubmissionsPerDay: 0,
      canSubmit: false
    });
    expect(api.getCreditRuleForScore(0)).toEqual({
      minScore: 0,
      maxSubmissionsPerDay: 0,
      canSubmit: false
    });
    expect(api.getCreditRuleForScore(-1)).toEqual({
      minScore: 0,
      maxSubmissionsPerDay: 0,
      canSubmit: false
    });
    expect(api.canSubmit(39)).toBe(false);
    expect(api.canSubmit(-1)).toBe(false);
    expect(api.getMaxSubmissionsForScore(0)).toBe(0);
  });
});

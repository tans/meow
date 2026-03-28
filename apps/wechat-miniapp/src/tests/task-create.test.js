import { describe, expect, it } from "vitest";
import { buildBudgetSummary } from "../view-models/task-create.js";

describe("task create budget summary", () => {
  it("adds base and ranking reward budgets", () => {
    expect(
      buildBudgetSummary({ baseAmount: 5, baseCount: 10, rankingTotal: 100 })
    ).toEqual({
      lockedTotal: 150
    });
  });
});

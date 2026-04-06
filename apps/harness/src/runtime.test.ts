import { beforeEach, describe, expect, it, vi } from "vitest";

const wrappedTransitions = vi.hoisted(() => ({
  fundTask$: vi.fn(),
  publishTask$: vi.fn(),
  endTaskIfExpired$: vi.fn(),
  endTask$: vi.fn(),
  settleTask$: vi.fn(),
}));

vi.mock("@meow/domain-task", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@meow/domain-task")>();

  wrappedTransitions.fundTask$.mockImplementation((task) => actual.fundTask(task));
  wrappedTransitions.publishTask$.mockImplementation((task) => actual.publishTask(task));
  wrappedTransitions.endTaskIfExpired$.mockImplementation((task) => actual.endTaskIfExpired(task));
  wrappedTransitions.endTask$.mockImplementation((task) => actual.endTask(task));
  wrappedTransitions.settleTask$.mockImplementation((task) => actual.settleTask(task));

  return {
    ...actual,
    fundTask$: wrappedTransitions.fundTask$,
    publishTask$: wrappedTransitions.publishTask$,
    endTaskIfExpired$: wrappedTransitions.endTaskIfExpired$,
    endTask$: wrappedTransitions.endTask$,
    settleTask$: wrappedTransitions.settleTask$,
  };
});

import { evaluateScenarios, replayScenario } from "./runtime.js";
import { scenarios } from "./scenarios.js";

describe("evaluateScenarios", () => {
  beforeEach(() => {
    wrappedTransitions.fundTask$.mockClear();
    wrappedTransitions.publishTask$.mockClear();
    wrappedTransitions.endTaskIfExpired$.mockClear();
    wrappedTransitions.endTask$.mockClear();
    wrappedTransitions.settleTask$.mockClear();
  });

  it("replays merchant-funded-task with the domain-task event wrappers", () => {
    const merchantFundedTask = scenarios.filter((scenario) => scenario.id === "merchant-funded-task");

    evaluateScenarios(merchantFundedTask);

    expect(wrappedTransitions.fundTask$).toHaveBeenCalledTimes(1);
    expect(wrappedTransitions.publishTask$).toHaveBeenCalledTimes(1);
    expect(wrappedTransitions.endTaskIfExpired$).toHaveBeenCalledTimes(1);
    expect(wrappedTransitions.endTask$).toHaveBeenCalledTimes(0);
    expect(wrappedTransitions.settleTask$).toHaveBeenCalledTimes(1);
  });

  it("returns the creator-earning-loop replay steps in order", () => {
    const creatorEarningLoop = scenarios.find((scenario) => scenario.id === "creator-earning-loop");

    expect(creatorEarningLoop).toBeDefined();
    expect(replayScenario(creatorEarningLoop!)).toMatchObject({
      scenarioId: "creator-earning-loop",
      ok: true,
      steps: ["register", "browse", "submit", "approve", "settle", "withdraw"],
    });
  });
});

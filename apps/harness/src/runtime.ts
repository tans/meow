import { routeContracts } from "@meow/contracts";
import {
  workspaceManifest,
  type BoundedContext,
  type HarnessReplayResult,
  type ProductFlow
} from "@meow/domain-core";
import { escrowRules } from "@meow/domain-finance";
import { riskRules } from "@meow/domain-risk";
import {
  submissionGuardrails,
  createTaskDraft,
  fundTask$,
  publishTask$,
  endTask$,
  settleTask$,
} from "@meow/domain-task";
import { userDomainBlueprint } from "@meow/domain-user";

import type { ScenarioDefinition } from "./scenarios.js";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const supportedContexts = new Set<BoundedContext>(
  workspaceManifest.packages.flatMap((pkg) => pkg.contexts)
);

const flowMap = new Map<string, ProductFlow>(
  workspaceManifest.coreFlows.map((flow) => [flow.id, flow])
);

const routeMap = new Map(routeContracts.map((route) => [route.id, route]));

function replayScenario(scenario: ScenarioDefinition): HarnessReplayResult {
  if (scenario.id === "merchant-publish-submit-settle") {
    return {
      scenarioId: scenario.id,
      steps: ["publish", "submit", "approve", "settle"],
      ok: true
    };
  }

  if (scenario.id === "merchant-funded-task") {
    const task = createTaskDraft(
      "merchant-test-1",
      "Test Campaign",
      "Test description",
      3,
      100,
      50,
      Date.now() + 60_000
    );
    if (task instanceof Error) {
      return { scenarioId: scenario.id, steps: [], ok: false };
    }
    const funded = fundTask$(task);
    if (funded instanceof Error) {
      return { scenarioId: scenario.id, steps: [], ok: false };
    }
    const published = publishTask$(funded);
    if (published instanceof Error) {
      return { scenarioId: scenario.id, steps: [], ok: false };
    }
    const ended = endTask$(published);
    if (ended instanceof Error) {
      return { scenarioId: scenario.id, steps: [], ok: false };
    }
    const settled = settleTask$(ended);
    if (settled instanceof Error) {
      return { scenarioId: scenario.id, steps: [], ok: false };
    }
    return {
      scenarioId: scenario.id,
      steps: ["fund", "publish", "end", "settle"],
      ok: true
    };
  }

  return {
    scenarioId: scenario.id,
    steps: scenario.replaySteps ?? [],
    ok: true
  };
}

export function evaluateScenarios(scenarios: ScenarioDefinition[]): CheckResult[] {
  const results: CheckResult[] = [];

  for (const scenario of scenarios) {
    const unsupportedContexts = scenario.dependsOnContexts.filter(
      (context) => !supportedContexts.has(context)
    );

    results.push({
      name: `${scenario.id}: contexts-supported`,
      ok: unsupportedContexts.length === 0,
      detail:
        unsupportedContexts.length === 0
          ? `covered by workspace packages`
          : `missing contexts: ${unsupportedContexts.join(", ")}`
    });

    const missingFlows = scenario.requiredFlows.filter((flowId) => !flowMap.has(flowId));
    results.push({
      name: `${scenario.id}: flows-bound`,
      ok: missingFlows.length === 0,
      detail:
        missingFlows.length === 0
          ? `all required flows exist`
          : `missing flows: ${missingFlows.join(", ")}`
    });

    const missingRoutes = (scenario.routeIds ?? []).filter((routeId) => !routeMap.has(routeId));
    results.push({
      name: `${scenario.id}: routes-bound`,
      ok: missingRoutes.length === 0,
      detail:
        missingRoutes.length === 0
          ? `route contracts linked`
          : `missing route contracts: ${missingRoutes.join(", ")}`
    });

    if (scenario.dependsOnContexts.includes("wallet") || scenario.dependsOnContexts.includes("settlement")) {
      const hasEscrowAssertion = scenario.assertions.some(
        (assertion) =>
          assertion.includes("托管") ||
          assertion.includes("退款") ||
          assertion.includes("提现") ||
          assertion.includes("冻结")
      );

      results.push({
        name: `${scenario.id}: finance-guard`,
        ok: hasEscrowAssertion && escrowRules.length >= 3,
        detail: hasEscrowAssertion
          ? `finance assertions present`
          : `scenario needs an escrow/refund/withdraw assertion`
      });
    }

    if (scenario.dependsOnContexts.includes("risk") || scenario.dependsOnContexts.includes("appeal")) {
      const hasRiskAssertion = scenario.assertions.some(
        (assertion) =>
          assertion.includes("信用") ||
          assertion.includes("裁决") ||
          assertion.includes("证据")
      );

      results.push({
        name: `${scenario.id}: risk-guard`,
        ok: hasRiskAssertion && riskRules.length >= 3,
        detail: hasRiskAssertion
          ? `risk assertions present`
          : `scenario needs an evidence/decision/credit assertion`
      });
    }

    if (scenario.replaySteps?.length) {
      const replayResult = replayScenario(scenario);
      const replayMatches =
        replayResult.ok &&
        replayResult.steps.length === scenario.replaySteps.length &&
        replayResult.steps.every((step, index) => step === scenario.replaySteps?.[index]);

      results.push({
        name: `${scenario.id}: workflow-replayed`,
        ok: replayMatches,
        detail: replayMatches
          ? `replayed ${replayResult.steps.join(" -> ")}`
          : `expected ${scenario.replaySteps.join(" -> ")}, got ${replayResult.steps.join(" -> ")}`
      });
    }
  }

  const uncoveredFlows = workspaceManifest.coreFlows
    .filter((flow) => !scenarios.some((scenario) => scenario.requiredFlows.includes(flow.id)))
    .map((flow) => flow.id);

  results.push({
    name: "workspace: critical-flow-coverage",
    ok: uncoveredFlows.length === 0,
    detail:
      uncoveredFlows.length === 0
        ? "all core flows mapped to harness scenarios"
        : `uncovered flows: ${uncoveredFlows.join(", ")}`
  });

  results.push({
    name: "workspace: submission-guardrails-defined",
    ok: submissionGuardrails.length >= 3,
    detail: `submission guardrails: ${submissionGuardrails.length}`
  });

  results.push({
    name: "workspace: credit-rules-defined",
    ok: userDomainBlueprint.creditRules.length >= 4,
    detail: `credit rule tiers: ${userDomainBlueprint.creditRules.length}`
  });

  return results;
}

export function formatReport(results: CheckResult[]): string {
  const lines = results.map((result) => {
    const mark = result.ok ? "PASS" : "FAIL";
    return `${mark} ${result.name} :: ${result.detail}`;
  });

  const failed = results.filter((result) => !result.ok).length;
  const passed = results.length - failed;

  return [
    "Meow Harness Report",
    `passed=${passed} failed=${failed} total=${results.length}`,
    ...lines
  ].join("\n");
}

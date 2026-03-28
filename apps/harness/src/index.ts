import { formatReport, evaluateScenarios } from "./runtime.js";
import { scenarios } from "./scenarios.js";

const results = evaluateScenarios(scenarios);
const report = formatReport(results);

console.log(report);

if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}


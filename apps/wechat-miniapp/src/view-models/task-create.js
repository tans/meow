export const buildBudgetSummary = (input) => ({
  lockedTotal: input.baseAmount * input.baseCount + input.rankingTotal
});

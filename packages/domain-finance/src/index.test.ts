import { describe, expect, it } from "vitest";

import * as domainFinance from "./index.js";

type DomainFinanceApi = typeof import("./index.js");

const api = domainFinance as DomainFinanceApi;

describe("@meow/domain-finance", () => {
  it("exports reward and ledger constants", () => {
    expect(api.rewardTypes).toEqual(["base", "ranking", "tip"]);
    expect(api.rewardStatuses).toEqual(["frozen", "available", "cancelled"]);
    expect(api.ledgerAccounts).toEqual([
      "merchant_balance",
      "merchant_escrow",
      "creator_frozen",
      "creator_available"
    ]);
  });

  it("exports non-empty escrow rules with unique ids", () => {
    expect(api.escrowRules.length).toBeGreaterThan(0);

    const ids = api.escrowRules.map((rule) => rule.id);

    expect(ids).toHaveLength(new Set(ids).size);
  });

  it("does not expose getMaxSubmissionsForScore", () => {
    expect("getMaxSubmissionsForScore" in api).toBe(false);
  });

  it("exports finance console responsibilities", () => {
    expect(api.financeConsoleResponsibilities).toEqual([
      "商家充值、退款、余额和账单核对",
      "创作者收益、冻结资金和提现处理",
      "按任务类型与奖励类型配置平台抽成",
      "每日和每月生成对账报表"
    ]);
  });
});

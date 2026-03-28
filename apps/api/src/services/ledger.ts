import type { LedgerAccount } from "@meow/domain-finance";
import { demoFinanceConfig } from "@meow/domain-finance";

export interface LedgerEntryInput {
  taskId: string;
  submissionId?: string;
  account: LedgerAccount;
  amount: number;
  direction: "debit" | "credit";
  note: string;
}

export interface MerchantLedgerLockResult {
  ledgerEffect: "merchant_escrow_locked";
  lockedAmount: number;
  entries: LedgerEntryInput[];
}

const createMirrorEntries = (
  debit: Omit<LedgerEntryInput, "direction">,
  credit: Omit<LedgerEntryInput, "direction">
): [LedgerEntryInput, LedgerEntryInput] => [
  {
    ...debit,
    direction: "debit"
  },
  {
    ...credit,
    direction: "credit"
  }
];

export const lockMerchantEscrow = (
  taskId: string
): MerchantLedgerLockResult => ({
  ledgerEffect: "merchant_escrow_locked",
  lockedAmount: demoFinanceConfig.publishEscrowLockedAmount,
  entries: createMirrorEntries(
    {
      taskId,
      account: "merchant_balance",
      amount: demoFinanceConfig.publishEscrowLockedAmount,
      note: "task_publish_lock"
    },
    {
      taskId,
      account: "merchant_escrow",
      amount: demoFinanceConfig.publishEscrowLockedAmount,
      note: "task_publish_lock"
    }
  )
});

export const freezeTipReward = (
  taskId: string,
  submissionId: string,
  amount: number
): [LedgerEntryInput, LedgerEntryInput] =>
  createMirrorEntries(
    {
      taskId,
      submissionId,
      account: "merchant_balance",
      amount,
      note: "tip_reward_frozen"
    },
    {
      taskId,
      submissionId,
      account: "creator_frozen",
      amount,
      note: "tip_reward_frozen"
    }
  );

export const releaseEscrowRewardsToFrozen = (
  taskId: string,
  amount: number
): [LedgerEntryInput, LedgerEntryInput] =>
  createMirrorEntries(
    {
      taskId,
      account: "merchant_escrow",
      amount,
      note: "reward_release_to_frozen"
    },
    {
      taskId,
      account: "creator_frozen",
      amount,
      note: "reward_release_to_frozen"
    }
  );

export const releaseFrozenRewardsToAvailable = (
  taskId: string,
  amount: number
): [LedgerEntryInput, LedgerEntryInput] =>
  createMirrorEntries(
    {
      taskId,
      account: "creator_frozen",
      amount,
      note: "reward_release_to_available"
    },
    {
      taskId,
      account: "creator_available",
      amount,
      note: "reward_release_to_available"
    }
  );

export const refundUnusedEscrow = (
  taskId: string,
  amount: number
): [LedgerEntryInput, LedgerEntryInput] =>
  createMirrorEntries(
    {
      taskId,
      account: "merchant_escrow",
      amount,
      note: "unused_budget_refund"
    },
    {
      taskId,
      account: "merchant_balance",
      amount,
      note: "unused_budget_refund"
    }
  );

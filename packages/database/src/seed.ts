export const demoUsers = {
  merchant: { id: "merchant-1", nickname: "Demo Merchant", role: "merchant" },
  creator: { id: "creator-1", nickname: "Demo Creator", role: "creator" }
} as const;

export function seedDemo() {
  return {
    merchant: demoUsers.merchant,
    creator: demoUsers.creator,
    task: {
      id: "task-1",
      merchantId: demoUsers.merchant.id,
      status: "published"
    },
    submission: {
      id: "submission-1",
      creatorId: demoUsers.creator.id,
      taskId: "task-1",
      status: "submitted"
    },
    reward: {
      id: "reward-1",
      submissionId: "submission-1",
      type: "base",
      status: "frozen"
    },
    ledgerAccounts: [
      { type: "merchant_balance" },
      { type: "merchant_escrow" },
      { type: "creator_frozen" },
      { type: "creator_available" }
    ]
  };
}

export const demoUsers = {
  merchant: { id: "merchant-1", nickname: "Demo Merchant", role: "merchant" },
  creator: { id: "creator-1", nickname: "Demo Creator", role: "creator" }
} as const;

export function seedDemo() {
  return {
    merchant: demoUsers.merchant,
    creator: demoUsers.creator,
    ledgerAccounts: [
      { type: "merchant_balance" },
      { type: "merchant_escrow" },
      { type: "creator_frozen" },
      { type: "creator_available" }
    ]
  };
}

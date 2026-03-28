import { demoUsers } from "./seed.js";

export async function createTestDb() {
  return {
    async seedDemo() {
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
  };
}

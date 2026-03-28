import { describe, expect, it } from "vitest";
import { createTestDb } from "../test-db.js";

describe("database schema", () => {
  it("creates merchant, task, submission, reward, and ledger records", async () => {
    const db = await createTestDb();
    const seeded = await db.seedDemo();

    expect(seeded.merchant.role).toBe("merchant");
    expect(seeded.creator.role).toBe("creator");
    expect(seeded.ledgerAccounts).toHaveLength(4);
  });
});

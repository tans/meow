import { describe, expect, it } from "vitest";
import { seedDemo } from "../seed.js";
import { createTestDb } from "../test-db.js";

describe("database schema", () => {
  it("creates merchant, task, submission, reward, and ledger records", async () => {
    const db = await createTestDb();
    const seeded = await db.seedDemo();
    const seededFromHelper = seedDemo();

    expect(seeded.merchant.role).toBe("merchant");
    expect(seeded.creator.role).toBe("creator");
    expect(seeded.ledgerAccounts).toHaveLength(4);
    expect(seeded).toEqual(seededFromHelper);
  });
});

import { describe, expect, it } from "vitest";
import * as runtimeExports from "../client.js";
import { seedDemo } from "../seed.js";
import { createTestDb } from "../test-db.js";

describe("database schema", () => {
  it("creates merchant, task, submission, reward, and ledger records", async () => {
    const db = await createTestDb();
    const seeded = await db.seedDemo();
    const seededFromHelper = seedDemo();

    expect(seeded.merchant.role).toBe("merchant");
    expect(seeded.creator.role).toBe("creator");
    expect(seeded.task.id).toBe("task-1");
    expect(seeded.submission.id).toBe("submission-1");
    expect(seeded.reward.id).toBe("reward-1");
    expect(seeded.ledgerAccounts).toHaveLength(4);
    expect(seeded).toEqual(seededFromHelper);
    expect("seedDemo" in runtimeExports).toBe(false);
    expect("createTestDb" in runtimeExports).toBe(false);
  });
});

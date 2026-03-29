import { describe, expect, it } from "vitest";
import * as runtimeExports from "../client.js";
import { seedDemo } from "../seed.js";
import { createTestDb } from "../test-db.js";

describe("database schema", () => {
  it("creates seeded users and task records", async () => {
    const db = await createTestDb();
    const seeded = await db.seedDemo();
    const seededFromHelper = seedDemo(db.repository);

    expect(seeded.merchant.roles).toEqual(["merchant"]);
    expect(seeded.creator.roles).toEqual(["creator"]);
    expect(seeded.hybrid.roles).toEqual(["creator", "merchant"]);
    expect(seeded.task.id).toBe("task-1");
    expect(seeded.ledgerAccounts).toHaveLength(4);
    expect(seeded).toEqual(seededFromHelper);
    expect("seedDemo" in runtimeExports).toBe(true);
    expect("createTestDb" in runtimeExports).toBe(false);
  });
});

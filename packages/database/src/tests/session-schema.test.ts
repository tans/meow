import { describe, expect, it } from "vitest";
import { createTestDb } from "../test-db.js";

describe("session schema with seeded users", () => {
  it("seeds a hybrid user and persists sessions", async () => {
    const db = await createTestDb();
    const seeded = await db.seedDemo();

    expect(seeded.hybrid.roles).toEqual(["creator", "merchant"]);

    const hybrid = db.repository.findUserByIdentifier("hybrid@example.com");
    expect(hybrid).toMatchObject({
      id: seeded.hybrid.id,
      displayName: "Demo Hybrid",
      roles: ["creator", "merchant"]
    });

    const session = db.repository.createSession({
      userId: seeded.hybrid.id,
      activeRole: "creator",
      client: "web"
    });
    const persisted = db.repository.findSession(session.id);

    expect(persisted).toEqual(session);
  });
});

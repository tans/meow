import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("merchant publish flow", () => {
  it("locks base and ranking budget before publishing", async () => {
    const response = await app.request("/merchant/tasks/task-1/publish", {
      method: "POST",
      headers: { "x-demo-user": "merchant-1" }
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "published",
      ledgerEffect: "merchant_escrow_locked"
    });
  });
});

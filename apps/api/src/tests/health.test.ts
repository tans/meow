import { surfaceIds } from "@meow/contracts";
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("api health", () => {
  it("responds with ok and the registered surface list", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: "meow-api",
      surfaces: surfaceIds
    });
  });
});

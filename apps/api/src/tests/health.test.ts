import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("api health", () => {
  it("responds with ok", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "meow-api"
    });
  });
});

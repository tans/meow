import { describe, expect, it } from "vitest";
import { app } from "../app.js";

const unhandledErrorRoute = "/__tests__/error-response/unhandled";

app.get(unhandledErrorRoute, () => {
  throw new Error("sensitive stack detail");
});

describe("api error responses", () => {
  it("formats merchant route AppError responses with status metadata", async () => {
    const response = await app.request("/merchant/tasks");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "missing session",
      status: 401
    });
  });

  it("formats not found responses with the shared JSON shape", async () => {
    const response = await app.request("/does-not-exist");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Route not found",
      status: 404
    });
  });

  it("hides raw unhandled error details from clients", async () => {
    const response = await app.request(unhandledErrorRoute);

    expect(response.status).toBe(500);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({
      error: "An unexpected error occurred",
      status: 500
    });
    expect(body.error).not.toBe("sensitive stack detail");
  });
});

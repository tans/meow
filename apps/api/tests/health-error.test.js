import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { surfaceIds } from "../../../packages/contracts/index.js";
import { createTestContext } from "./helpers.js";

const unhandledErrorRoute = "/__tests__/error-response/unhandled";

describe("api health and error responses", () => {
  let testContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  afterEach(() => {
    testContext.cleanup();
  });

  it("responds with ok and registered surface ids", async () => {
    const response = await testContext.app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      service: "meow-api",
      surfaces: surfaceIds,
    });
  });

  it("reports version metadata", async () => {
    const response = await testContext.app.request("/version");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      packageVersion: expect.any(String),
      buildTime: expect.any(String),
    });
  });

  it("formats not found responses with the shared json shape", async () => {
    const response = await testContext.app.request("/does-not-exist");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Route not found",
      status: 404,
    });
  });

  it("hides raw unhandled error details from clients", async () => {
    const response = await testContext.app.request(unhandledErrorRoute);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "An unexpected error occurred",
      status: 500,
    });
  });

  it("returns the shared 401 error shape for unauthenticated admin dashboard requests", async () => {
    const response = await testContext.app.request("/admin/dashboard");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: expect.any(String),
      status: 401,
    });
  });

  it("returns the shared 401 error shape for unauthenticated role switch requests", async () => {
    const response = await testContext.app.request("/auth/switch-role", {
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: expect.any(String),
      status: 401,
    });
  });

  it("returns the shared 401 error shape for unauthenticated submission withdraw requests", async () => {
    const response = await testContext.app.request("/creator/submissions/test-id/withdraw", {
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: expect.any(String),
      status: 401,
    });
  });
});

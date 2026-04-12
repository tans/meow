import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("bun entry gateway", () => {
  let workspaceRoot;

  beforeEach(() => {
    workspaceRoot = mkdtempSync(join(tmpdir(), "meow-entry-test-"));
    mkdirSync(join(workspaceRoot, "apps/www"), { recursive: true });
    mkdirSync(join(workspaceRoot, "apps/square"), { recursive: true });
    mkdirSync(join(workspaceRoot, "apps/admin"), { recursive: true });
    mkdirSync(join(workspaceRoot, "apps/buyer"), { recursive: true });

    writeFileSync(join(workspaceRoot, "apps/www/index.html"), "<html><body>www-home</body></html>");
    writeFileSync(join(workspaceRoot, "apps/square/index.html"), "<html><body>square-home</body></html>");
    writeFileSync(join(workspaceRoot, "apps/admin/index.html"), "<html><body>admin-home</body></html>");
    writeFileSync(join(workspaceRoot, "apps/buyer/index.html"), "<html><body>buyer-home</body></html>");
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  it("proxies /api requests and serves spa entry documents", async () => {
    const { createEntryApp } = await import("../server.js");
    const app = createEntryApp({
      rootDir: workspaceRoot,
      fetchApi: async (request) =>
        new Response(JSON.stringify({ ok: true, pathname: new URL(request.url).pathname }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    const apiResponse = await app.fetch(new Request("http://localhost/api/health"));
    expect(apiResponse.status).toBe(200);
    expect(await apiResponse.json()).toEqual({
      ok: true,
      pathname: "/health",
    });

    const wwwResponse = await app.fetch(new Request("http://localhost/"));
    expect(wwwResponse.status).toBe(200);
    expect(await wwwResponse.text()).toContain("www-home");

    const squareResponse = await app.fetch(new Request("http://localhost/square/"));
    expect(squareResponse.status).toBe(200);
    expect(await squareResponse.text()).toContain("square-home");

    const adminResponse = await app.fetch(new Request("http://localhost/admin/"));
    expect(adminResponse.status).toBe(200);
    expect(await adminResponse.text()).toContain("admin-home");

    const buyerResponse = await app.fetch(new Request("http://localhost/buyer/"));
    expect(buyerResponse.status).toBe(200);
    expect(await buyerResponse.text()).toContain("buyer-home");
  });
});

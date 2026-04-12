import { describe, expect, it } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createEntryApp } from "./server.js";

const createFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), "meow-entry-test-"));
  const writeApp = async (name, html) => {
    const dir = join(root, "apps", name);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "index.html"), html);
    await writeFile(join(dir, "styles.css"), "body { color: black; }");
    await writeFile(join(dir, "app.js"), "window.__MEOW__ = true;");
  };

  await writeApp("www", "<html><body>www home</body></html>");
  await writeApp("square", "<html><body>square home</body></html>");
  await writeApp("admin", "<html><body>admin home</body></html>");
  await writeApp("buyer", "<html><body>buyer home</body></html>");

  return {
    root,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
};

describe("entry server", () => {
  it("serves SPA shells and static assets from app roots", async () => {
    const fixture = await createFixture();
    const app = createEntryApp({
      rootDir: fixture.root,
      apiOrigin: "http://127.0.0.1:65535",
    });

    const home = await app.handle(new Request("http://localhost/"));
    expect(home.status).toBe(200);
    expect(await home.text()).toContain("www home");

    const square = await app.handle(new Request("http://localhost/square/earnings"));
    expect(square.status).toBe(200);
    expect(await square.text()).toContain("square home");

    const adminAsset = await app.handle(new Request("http://localhost/admin/styles.css"));
    expect(adminAsset.status).toBe(200);
    expect(await adminAsset.text()).toContain("color: black");

    const buyer = await app.handle(new Request("http://localhost/buyer/#/tasks"));
    expect(buyer.status).toBe(200);
    expect(await buyer.text()).toContain("buyer home");

    await fixture.cleanup();
  });
});

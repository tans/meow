import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(process.cwd());
const projectConfigPath = path.join(projectRoot, "project.config.json");
const projectConfig = JSON.parse(readFileSync(projectConfigPath, "utf8"));
const miniProgramRoot = path.resolve(
  projectRoot,
  projectConfig.miniprogramRoot || "."
);
const appConfigPath = path.join(miniProgramRoot, "app.json");
const appConfig = JSON.parse(readFileSync(appConfigPath, "utf8"));

const relativeImportPattern =
  /import\s+[^"'\n]+\s+from\s+["'](\.[^"']+)["']/g;
const fileExtensions = [".js", ".json", ".wxml", ".wxss"];

const isTrackedByGit = (relativePath) => {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", relativePath], {
      cwd: projectRoot,
      stdio: "ignore"
    });
    return true;
  } catch {
    return false;
  }
};

describe("wechat project config", () => {
  it("keeps page imports inside the declared mini program root", () => {
    const pageFiles = appConfig.pages.map((pagePath) =>
      path.join(miniProgramRoot, `${pagePath}.js`)
    );
    const escapedRoot = `${miniProgramRoot}${path.sep}`;

    pageFiles.forEach((file) => {
      const source = readFileSync(file, "utf8");
      const imports = [...source.matchAll(relativeImportPattern)].map(
        (match) => match[1]
      );

      imports.forEach((specifier) => {
        const resolved = path.resolve(path.dirname(file), specifier);
        expect(
          resolved === miniProgramRoot ||
            resolved.startsWith(escapedRoot),
          `${path.relative(projectRoot, file)} imports ${specifier}, which resolves outside ${path.relative(projectRoot, miniProgramRoot)}`
        ).toBe(true);
      });
    });
  });

  it("exposes the creator-community tab bar and keeps wallet as a secondary page", () => {
    expect(appConfig.tabBar.list).toEqual([
      { pagePath: "pages/tasks/index", text: "悬赏大厅" },
      { pagePath: "pages/workspace/index", text: "获奖作品" },
      { pagePath: "pages/profile/index", text: "我的" }
    ]);
    expect(appConfig.pages).toContain("pages/wallet/index");
  });

  it("keeps declared root runtime files tracked in git", () => {
    const declaredRuntimeFiles = [
      "app.js",
      "app.json",
      "app.wxss",
      ...appConfig.pages.flatMap((pagePath) =>
        fileExtensions.map((ext) => `${pagePath}${ext}`)
      )
    ];

    declaredRuntimeFiles.forEach((runtimeFile) => {
      expect(
        isTrackedByGit(runtimeFile),
        `${runtimeFile} is declared by root runtime but not tracked in git`
      ).toBe(true);
    });
  });
});

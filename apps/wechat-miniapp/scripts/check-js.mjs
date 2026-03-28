import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanDirs = ["miniprogram", "src"];

const collectJsFiles = (dir) => {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir).flatMap((entry) => {
    const entryPath = path.join(dir, entry);
    const entryStat = statSync(entryPath);

    if (entryStat.isDirectory()) {
      return collectJsFiles(entryPath);
    }

    return entryPath.endsWith(".js") ? [entryPath] : [];
  });
};

const files = scanDirs.flatMap((dir) => collectJsFiles(path.join(root, dir)));

files.forEach((file) => {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
});

console.log(`Checked ${files.length} native mini program JavaScript files.`);

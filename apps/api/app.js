import { app, createApiApp } from "./server.js";

export { app };

export function createApp(options = {}) {
  const isTest =
    options.isTest ??
    (
      process.env.NODE_ENV === "test" ||
      process.env.VITEST === "true"
    );

  return createApiApp({
    dbPath:
      options.dbPath ??
      (isTest ? ":memory:" : process.env.MEOW_DB_PATH ?? "meow.sqlite"),
    seedDemo:
      options.seedDemo ??
      options.seed ??
      (process.env.MEOW_DEMO_SEED === "true" || isTest),
    uploadDir: options.uploadDir ?? process.env.MEOW_UPLOAD_DIR,
    demoAuthEnabled:
      options.demoAuthEnabled ??
      (isTest ? true : undefined),
    cookieSecure: options.cookieSecure,
    buildTime: options.buildTime,
    packageVersion: options.packageVersion,
  });
}

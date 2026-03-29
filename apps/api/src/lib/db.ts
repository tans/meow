import { seedDemo } from "@meow/database";
import { createRepository } from "@meow/database/sqlite";

const isTestEnv = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
const shouldSeedDemo = process.env.MEOW_DEMO_SEED === "true" || isTestEnv;
const filename = isTestEnv ? ":memory:" : process.env.MEOW_DB_PATH ?? "meow.sqlite";

export const db = createRepository(filename, {
  seedDemo: false,
  busyTimeoutMs: 5000,
  enableWal: filename !== ":memory:"
});

if (shouldSeedDemo) {
  seedDemo(db);
}

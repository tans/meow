import { createDatabase } from "../../../packages/database/db.js";
import { createRepository } from "../../../packages/database/repository.js";
import { seedDemo } from "../../../packages/database/seed.js";

const isTestEnv =
  process.env.VITEST === "true" || process.env.NODE_ENV === "test";

const defaultDbPath = isTestEnv
  ? ":memory:"
  : (process.env.MEOW_DB_PATH ?? "meow.sqlite");

const defaultSeedDemo = process.env.MEOW_DEMO_SEED === "true" || isTestEnv;

export function createApiDbContext(options = {}) {
  const sqliteDb = createDatabase({
    dbPath: options.dbPath ?? defaultDbPath,
    isTest: options.dbPath === ":memory:" ? true : isTestEnv,
    seed: false,
  });

  if (options.seedDemo ?? defaultSeedDemo) {
    seedDemo(sqliteDb);
  }

  return {
    sqliteDb,
    db: createRepository(sqliteDb),
    close() {
      sqliteDb.close();
    },
  };
}

const defaultContext = createApiDbContext();

export const db = defaultContext.db;
export const sqliteDb = defaultContext.sqliteDb;

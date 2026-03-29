import { createRepository } from "@meow/database/sqlite";

export const db = createRepository(process.env.MEOW_DB_PATH ?? "meow.sqlite", {
  seedDemo: true
});

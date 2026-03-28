export interface DatabaseClient {
  readonly connected: boolean;
}

export const databaseClient: DatabaseClient = {
  connected: false
};

export * from "./schema.js";
export * from "./seed.js";
export * from "./test-db.js";

export interface DatabaseClient {
  readonly connected: boolean;
}

export const databaseClient: DatabaseClient = {
  connected: true
};

export * from "./schema.js";
export * from "./repository.js";
export * from "./seed.js";

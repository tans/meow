export interface DatabaseClient {
  readonly connected: boolean;
}

export const databaseClient: DatabaseClient = {
  connected: false
};

import { seedDemo } from "./seed.js";
import { createRepository } from "./sqlite.js";

export async function createTestDb() {
  const repository = createRepository(":memory:");

  return {
    repository,
    async seedDemo() {
      return seedDemo(repository);
    }
  };
}

import { seedDemo } from "./seed.js";

export async function createTestDb() {
  return {
    async seedDemo() {
      return seedDemo();
    }
  };
}

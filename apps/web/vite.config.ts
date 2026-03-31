import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/health": "http://127.0.0.1:3001",
      "/auth": "http://127.0.0.1:3001",
      "/creator": "http://127.0.0.1:3001",
      "/merchant": "http://127.0.0.1:3001",
      "/admin": "http://127.0.0.1:3001"
    }
  },
  test: {
    environment: "jsdom"
  }
});

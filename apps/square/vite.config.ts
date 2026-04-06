import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/square/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 20403,
    host: "0.0.0.0",
    allowedHosts: ["meow.host", "localhost"],
  },
  test: {
    environment: "jsdom",
  },
});

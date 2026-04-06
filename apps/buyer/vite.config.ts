import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/buyer/",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 20404,
    host: "0.0.0.0",
    allowedHosts: ["meow.host", "meow.ali.minapp.xin", "localhost"],
  },
  test: {
    environment: "jsdom",
  },
});

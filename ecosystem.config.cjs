module.exports = {
  apps: [
    {
      name: "meow-api",
      cwd: "/data/meow/current",
      script: "apps/api/dist/index.js",
      interpreter: "bun",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        PORT: "3001",
        MEOW_DB_PATH: "/data/meow/shared/data/meow.sqlite",
        MEOW_COOKIE_SECURE: "true",
        MEOW_DEMO_AUTH: "true",
        MEOW_DEMO_SEED: "true"
      }
    }
  ]
};

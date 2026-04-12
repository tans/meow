module.exports = {
  apps: [
    {
      name: "meow-api",
      script: "/root/.bun/bin/bun",
      args: "run server.js",
      cwd: "/data/meow/current/apps/api",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      env: {
        API_PORT: "26411",
        MEOW_DB_PATH: "/data/meow/shared/data/meow.sqlite",
        MEOW_UPLOAD_DIR: "/data/meow/shared/uploads",
        MEOW_DEMO_AUTH: "true",
        MEOW_DEMO_SEED: "true"
      }
    },
    {
      name: "meow-entry",
      script: "/root/.bun/bin/bun",
      args: "run server.js",
      cwd: "/data/meow/current/apps/entry",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      env: {
        ENTRY_PORT: "26401",
        API_PORT: "26411",
        MEOW_APP_ROOT: "/data/meow/current"
      }
    }
  ]
};

# Meow

Meow is a Bun-first demo marketplace for AI content tasks.

- `apps/www`: landing page
- `apps/square`: creator app
- `apps/buyer`: merchant app
- `apps/admin`: operator app
- `apps/api`: Bun HTTP API + SQLite
- `apps/entry`: single Bun gateway for static apps and `/api`

## Stack

| Layer | Stack |
| --- | --- |
| Runtime | Bun |
| Database | `bun:sqlite` |
| UI | daisyUI + jQuery |
| Gateway | Bun HTTP |
| Deployment | PM2 |

## Ports

| Service | Env | Default |
| --- | --- | --- |
| Entry | `ENTRY_PORT` | `26401` |
| API | `API_PORT` | `26411` |
| Web | `WEB_PORT` | `26412` |
| Admin | `ADMIN_PORT` | `26413` |

## Local Development

Install dependencies with Bun if needed:

```bash
bun install
```

Run the API in one terminal:

```bash
cd apps/api
bun run server.js
```

Run the gateway in a second terminal:

```bash
cd apps/entry
API_PORT=26411 ENTRY_PORT=26401 bun run server.js
```

The gateway serves:

- `/` -> `apps/www`
- `/square/` -> `apps/square`
- `/buyer/` -> `apps/buyer`
- `/admin/` -> `apps/admin`
- `/api/*` -> `apps/api`

## Verification

Run the verified test suites:

```bash
bun test apps/api/server.test.js
bun test apps/entry/server.test.js
```

Manual smoke checks:

```bash
curl http://127.0.0.1:26401/api/health
curl http://127.0.0.1:26401/
curl http://127.0.0.1:26401/square/
curl http://127.0.0.1:26401/admin/
curl http://127.0.0.1:26401/buyer/
```

Demo credentials:

- Merchant: `merchant@example.com` / `demo-pass`
- Creator: `creator@example.com` / `demo-pass`
- Operator: `operator@example.com` / `demo-pass`

## Deployment

`deploy-meow.sh` now deploys the Bun stack directly:

1. Runs local Bun tests.
2. Uploads `apps/` and `packages/` to the server.
3. Starts `meow-api` and `meow-entry` with PM2.
4. Verifies `/api/health` and each SPA route on the remote host.

Common commands:

```bash
./deploy-meow.sh all
./deploy-meow.sh deploy
./deploy-meow.sh verify
```

## Architecture

```text
browser
  -> entry :26401
      -> static apps (www / square / buyer / admin)
      -> /api/* proxy
          -> api :26411
              -> bun:sqlite
```

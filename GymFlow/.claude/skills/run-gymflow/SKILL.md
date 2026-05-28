---
name: run-gymflow
description: run, start, build, test, screenshot, verify GymFlow Next.js web app
---

Next.js 14 monorepo (Turborepo + pnpm). Driver: `smoke.sh` launches dev server and curl-checks 5 routes.

## Prerequisites

```bash
node --version   # ≥20 required
pnpm --version   # install: npm i -g pnpm@9
```

## Build

```bash
cd /home/jose-correia/Documentos/GymFlow
pnpm install
```

## Run (agent path)

```bash
PORT=3333 bash .claude/skills/run-gymflow/smoke.sh
```

Expected: `5 passed, 0 failed`. Server stops automatically after checks.

To keep the server running for manual inspection:

```bash
cd apps/web && PORT=3333 pnpm dev &
# check it's up:
curl -s -o /dev/null -w "%{http_code}" http://localhost:3333   # → 200
```

Key routes verified:

| Route | Expected |
|---|---|
| `/` | 200 |
| `/login` | 200 |
| `/cadastro` | 200 |
| `/dashboard` | 307 (→ /login, no session) |
| `/api/cnpj` | 307 (auth-guarded) |

## Run (human path)

```bash
cd apps/web && pnpm dev   # opens http://localhost:3000
```

## Gotchas

- **Workspace packages required:** run `pnpm install` from repo root, not `apps/web/`.
- **Missing `.env.local`:** `smoke.sh` auto-creates it with placeholder Supabase values so Next.js starts. Real Supabase + Stripe credentials needed for auth/payments to work.
- **Playwright unavailable** on Ubuntu 26.04 — use `curl` smoke checks above. Browser screenshots not supported in this environment.
- **Port 3000 occupied:** set `PORT=3333` (or any free port) — `smoke.sh` defaults to 3333.

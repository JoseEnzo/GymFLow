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

Rodar a partir da raiz do monorepo (`GymFlow-main/`):

```bash
pnpm install
```

## Run (agent path)

```bash
PORT=3333 bash .claude/skills/run-gymflow/smoke.sh
```

Expected: `5 passed, 0 failed`. Server stops automatically after checks. O script localiza a raiz do monorepo a partir de seu próprio caminho — funciona tanto no Windows (Git Bash) quanto no Linux nativo.

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
| `/api/cnpj` | 401 (guardRoute sem sessão) |

## Run (human path)

```bash
# com Doppler (recomendado — pega envs reais)
doppler run -- pnpm --filter @gymflow/web dev

# ou direto (precisa de .env.local manual)
cd apps/web && pnpm dev
```

## Gotchas

- **Envs reais ficam no Doppler.** O smoke.sh gera um `.env.local` stub só para o Next subir; auth/Stripe/Supabase de verdade exigem `doppler run`.
- **Workspace packages required:** rodar `pnpm install` da raiz `GymFlow-main/`, não de `apps/web/`.
- **Placeholders Upstash crashavam o servidor** — `.env.example` traz `https://...upstash.io` que passa em truthy check e quebra `Redis.fromEnv()`. Hoje `lib/rate-limit.ts` valida formato e o smoke.sh blanqueia esses campos.
- **Playwright indisponível:** use os curl smoke checks acima. Sem screenshots de browser nesse ambiente.
- **Port 3000 occupied:** set `PORT=3333` (or any free port) — `smoke.sh` defaults to 3333.

# MeuTrein

Plataforma SaaS multi-tenant pra academias pequenas. Owner cadastra a academia,
personais montam fichas de treino, alunos executam pelo celular e acompanham evolução.

> **Marca pública:** MeuTrein. **Repositório/monorepo interno:** `gymflow` (mantido por
> motivos de infra — ver [CLAUDE.md](CLAUDE.md#marca-meutrein-produto-vs-gymflow-interno)).

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** Next.js 15 (App Router) · React 18 · TypeScript · Tailwind · Zustand · shadcn/ui
- **Backend:** Supabase (Auth + PostgreSQL + Storage) com RLS multi-tenant
- **Pagamentos:** Stripe (checkout + webhook idempotente)
- **Anti-bot:** Cloudflare Turnstile · **Rate limit:** Upstash Redis (fallback in-memory)
- **E-mail transacional:** Resend (cron semanal de inatividade)
- **PWA:** `@ducanh2912/next-pwa` com cache `NetworkOnly` em rotas multi-tenant
- **Envs:** Doppler (fonte da verdade) · **Deploy:** Vercel · **Observability:** Sentry

## Requisitos

- Node ≥ 20
- pnpm ≥ 9
- Doppler CLI configurado no projeto `gymflow-s-org` (pra puxar envs reais em dev)

## Quickstart

```bash
pnpm install

# Recomendado: roda com envs reais do Doppler
doppler run -- pnpm --filter @gymflow/web dev

# Alternativa sem Doppler (precisa de .env.local manual em apps/web/)
pnpm dev

# Com Sentry/next-pwa instalados, Turbopack quebra. Use webpack:
pnpm --filter @gymflow/web dev:webpack
```

App sobe em [http://localhost:3000](http://localhost:3000).

## Estrutura

```
apps/
  web/                       Next.js (App Router)
    app/(auth)/              login, cadastro, código, convite, onboarding
    app/(dashboard)/         dashboard, alunos, treinos, exercícios, agenda…
    app/api/                 routes server-side (webhooks, cron, lookup…)
    components/              ui, layout (sidebar/bottom-nav/header), bioimpedance, charts
    lib/                     supabase, rate-limit, turnstile, resend, email-templates
    stores/                  Zustand (auth-store, ui-store)
packages/
  database/                  types.ts gerados via `pnpm db:types`
  ui/                        componentes compartilhados
  config/                    eslint + tsconfig compartilhados
supabase/
  migrations/                001…067 + remote_schema (sequencial)
```

## Scripts (na raiz)

| Comando | O que faz |
|---|---|
| `pnpm dev` | Dev server via Turbo |
| `pnpm dev:webpack` | Dev sem Turbopack (necessário com Sentry + next-pwa) |
| `pnpm build` | Build do monorepo |
| `pnpm type-check` | `tsc --noEmit` em todos pacotes |
| `pnpm db:push` | Aplica migrations no projeto Supabase linked (CUIDADO: aponta pra prod hoje) |
| `pnpm db:types` | Regenera `packages/database/src/types.ts` (rodar após toda migration) |
| `pnpm db:reset` | Reseta DB local Supabase |
| `pnpm format` | Prettier em todos `.ts/.tsx/.md/.json` |

## Roles e planos

| Role | Quem é |
|---|---|
| `owner` | Dono da academia (ou personal solo no plano Personal) |
| `personal` | Personal trainer vinculado a uma academia starter/pro |
| `student` | Aluno convidado |

| Plano | Preço | Limite alunos | Sub-personais |
|---|---|---|---|
| `personal` | R$ 97/mês | ilimitado | ❌ |
| `starter` | R$ 197/mês | até 50 | até 3 |
| `pro` | R$ 397/mês | ilimitado | ilimitado |

Owner do tenant = quem assinou. Personal trainer solo é `role='owner'` + `plan='personal'`.
Confusão recorrente: `role='personal'` (sub-personal numa academia) **≠** `plan='personal'`
(trainer solo dono do próprio mini-tenant).

## Segurança em camadas

1. **RLS no Postgres** — primeira e última linha. Todas as tabelas têm RLS habilitada.
2. **Middleware de sessão** (`apps/web/middleware.ts`) — protege rotas autenticadas. Allowlist
   explícita pra APIs públicas (webhooks Stripe, cron, lookup pré-login).
3. **Rate limit** (`apps/web/lib/rate-limit.ts`) — Upstash Redis com fallback in-memory.
4. **Cloudflare Turnstile** (`apps/web/lib/turnstile.ts`) — obrigatório em rotas públicas
   de auth e lookup.

## Documentação completa

[CLAUDE.md](CLAUDE.md) tem o material denso pra desenvolvimento:

- Marca MeuTrein vs GymFlow interno
- Convenções de código, Supabase, RLS, RPCs, Zustand
- Pegadinhas reais já encontradas (`.range()` inclusivo, `NEXT_PUBLIC_*` inlining,
  `.env.example` truthy quebrando `!process.env.X`, Doppler em dev)
- Tom de voz e copy pra landing/e-mails
- PWA offline (3 camadas: shell + snapshot IndexedDB + queue idempotente)
- Notificações via Resend (status atual + roadmap)
- Política de atualização desse próprio doc

Toda mudança que afeta comportamento documentado lá precisa atualizar a seção correspondente.

## Licença

Privado · © MeuTrein

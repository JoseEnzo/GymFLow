# Deploy na Vercel — MeuTrein (GymFlow)

Guia de deploy do app `GymFlow-main/apps/web` (Next.js 15) na Vercel.

> **Estrutura importante:** o app NÃO está na raiz do repo. Ele fica em
> `GymFlow-main/apps/web`, dentro de um monorepo pnpm (Turborepo). Isso muda
> a configuração — preste atenção no **Root Directory**.

---

## Pré-requisitos

- Conta na Vercel (plano Hobby/grátis serve).
- Repo no GitHub: `JoseEnzo/GymFLow`. Produção deploya da branch **`main`**.
- Build já validado localmente (`next build` passa — 60+ rotas).
- O `apps/web/vercel.json` já sobrescreve o build pra `next build`, evitando o
  `doppler run -- next build` do `package.json` que falharia na Vercel (não há
  `DOPPLER_TOKEN` lá). **Os valores das env vars vão direto na Vercel.**

---

## Variáveis de ambiente

> ⚠️ **Nunca cole segredos em chat/PR/commit.** Coloque direto no painel da
> Vercel ou nos prompts do CLI (`vercel env add`).

### Obrigatórias (sem elas o site abre quebrado)

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (secreto) |

### Recomendadas

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | `MeuTrein` |
| `NEXT_PUBLIC_APP_URL` | a URL gerada pela Vercel (preencher após o 1º deploy) |
| `SKIP_STRIPE_CHECKOUT` | `true` — só enquanto NÃO houver Stripe configurado |

### Opcionais (feature-gated, têm fallback — adicione quando precisar)

Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_*`), Resend
(`RESEND_API_KEY`, `RESEND_FROM_EMAIL`), `GOOGLE_PLACES_API_KEY`, Sentry
(`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`),
Upstash (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).

> O build passa só com as 3 do Supabase. Sentry/Upstash ausentes não quebram nada.

---

## Caminho A — CLI (recomendado para quem quer terminal)

Rode tudo a partir da **raiz do repo** (`/home/jose-correia/Downloads/GymFLow`).

```bash
# 1. Login (abre o navegador / pede código por e-mail)
vercel login

# 2. Criar e linkar o projeto (NÃO deploya ainda)
cd /home/jose-correia/Downloads/GymFLow
vercel link
#   Set up "~/Downloads/GymFLow"?      → yes
#   Which scope?                        → (sua conta / GymFlow's projects)
#   Link to existing project?          → no
#   What's your project's name?        → meutrein
#   In which directory is your code located?
#                                      → GymFlow-main/apps/web   ⚠️ CRÍTICO

# 3. Se o passo 2 NÃO perguntou o diretório, defina o Root Directory no painel:
#    vercel.com → projeto → Settings → General → Root Directory
#                → GymFlow-main/apps/web → Save

# 4. Adicionar as env vars (uma por vez; cole o valor quando pedir)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_NAME production       # valor: MeuTrein
vercel env add SKIP_STRIPE_CHECKOUT production       # valor: true

# 5. Deploy de produção
vercel --prod
```

Depois que sair a URL:

```bash
# 6. Registrar a URL pública e refazer o deploy pra inlinar
vercel env add NEXT_PUBLIC_APP_URL production        # valor: https://<sua-url>.vercel.app
vercel --prod
```

**Deploys futuros:** todo `git push` na `main` deploya sozinho. Manualmente:
`vercel --prod`.

---

## Caminho B — Painel (mais visual)

1. [vercel.com/new](https://vercel.com/new) → importar `JoseEnzo/GymFLow`.
2. **Root Directory** → Edit → `GymFlow-main/apps/web`.
3. **Application Preset** → `Next.js` (selecione manualmente se vier vazio).
4. **Environment Variables** → adicione as obrigatórias + recomendadas.
5. **Deploy**.
6. Após a URL: adicione `NEXT_PUBLIC_APP_URL` e faça **Redeploy**.

---

## Pós-deploy — banco de produção

As migrations (incluindo vídeos dos exercícios e dietas) precisam estar
aplicadas no Supabase de produção, senão páginas de vídeos/dietas quebram:

```bash
cd /home/jose-correia/Downloads/GymFLow/GymFlow-main
supabase link --project-ref SEU_PROJECT_REF   # uma vez
pnpm db:push
```

---

## Troubleshooting

| Sintoma no build/runtime | Causa provável | Correção |
|---|---|---|
| `No Next.js version detected` | Root Directory errado | Setar `GymFlow-main/apps/web` |
| `doppler: command not found` | `vercel.json` não aplicado | Confirmar que existe em `apps/web/vercel.json` |
| Site abre em branco / erro de Supabase | env var faltando | Conferir as 3 do Supabase |
| `Module not found: @gymflow/database` | deploy não incluiu o workspace | Deployar com Root Directory setado (não deployar só `apps/web` isolado) |
| Criar academia falha em produção | Stripe não configurado | `SKIP_STRIPE_CHECKOUT=true` ou configurar Stripe |
| Login/cadastro falha em prod | Turnstile/rate-limit exigindo env | Configurar Turnstile/Upstash ou revisar gate |

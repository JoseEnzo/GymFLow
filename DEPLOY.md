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

## Capacidade e conexões simultâneas

Como o app escala sob muitos usuários ao mesmo tempo e onde estão os limites.

### Modelo de conexões (importante)

O Next.js fala com o Postgres **via PostgREST/Supabase (HTTP)**, usando `supabase-js`
— **não** abre conexões diretas ao Postgres por função serverless. Quem mantém o
pool ao banco é o PostgREST gerenciado pela Supabase. Ou seja, escalar as funções
da Vercel **não** estoura `max_connections` do Postgres pela operação normal do app.

Conexões **diretas** ao Postgres (que consomem do limite) só acontecem em:
- migrations / `pnpm db:push`;
- qualquer serviço externo que use um driver Postgres direto (cron, ETL, etc.).

**Regra:** toda conexão direta deve usar o **Supavisor em transaction mode**
(string do pooler, porta `6543`), nunca a conexão direta (`5432`). Em serverless
a conexão direta esgota o limite quase imediatamente sob concorrência.
Pegar a string em: Supabase → Settings → Database → **Connection pooling**
(modo `Transaction`).

> O `[db.pooler]` em `supabase/config.toml` é só do `supabase start` (dev local).
> Não afeta produção — em prod o pooling é do Supavisor gerenciado.

### Alavancas de capacidade (em ordem de custo/benefício)

1. **Auth fora do hot path (já feito):** o `middleware.ts` valida o JWT localmente
   via `getClaims()` (JWKS) em vez de `getUser()`, eliminando 1 round-trip à Auth
   (GoTrue) em *todo* request. Requer **JWT signing keys assimétricas** ligadas:
   Supabase → Settings → Auth → **JWT Keys** → migrar de shared secret (HS256) para
   chave assimétrica (ECC/RSA). Sem isso o `getClaims` ainda valida, mas de forma
   remota (sem o ganho de latência). **Verificar esse toggle antes de um pico.**
2. **RLS otimizada (já feito):** migration `066` envolve `auth.uid()`/`auth.role()`
   em `(select …)` para avaliação única por query (InitPlan) — derruba a CPU de
   banco por usuário ativo. Aplicar com `pnpm db:push`.
3. **Compute add-on do Postgres:** o maior limitador de pico real. O tamanho do
   compute define `max_connections`, CPU e RAM. Subir de Micro/Small para um tier
   maior costuma ser o passo mais barato para o último trecho de capacidade.
   Supabase → Settings → **Compute and Disk**.
4. **Rate limiting distribuído:** garantir `UPSTASH_REDIS_REST_URL` +
   `UPSTASH_REDIS_REST_TOKEN` em prod. Sem eles o limiter cai para in-memory, que
   **não** escala horizontalmente entre as funções da Vercel (limite vira frouxo).

### Checklist pré-pico

- [ ] JWT signing keys assimétricas ligadas (alavanca 1).
- [ ] Migration `066` aplicada em prod (`pnpm db:push`).
- [ ] Upstash configurado em prod (não cair no fallback in-memory).
- [ ] Compute do Postgres dimensionado para o alvo de usuários simultâneos.
- [ ] Connection pooling (Transaction/6543) usado em qualquer conexão direta/CI.
- [ ] Monitorar no painel: % de conexões em uso, CPU do banco e p95 de latência.

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

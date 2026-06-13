# Diretrizes do Projeto GymFlow

# GymFlow — CLAUDE.md

Guia de contexto e boas práticas para o Claude Code trabalhar neste projeto.

---

## O que é o MeuTrein

Plataforma SaaS multi-tenant para academias. Academias se cadastram, personais montam fichas de treino e alunos registram progresso pelo celular.

**Três roles:** `owner` | `personal` | `student`
**Modelo:** cada academia é um tenant isolado via RLS no Supabase.

> O **produto** se chama **MeuTrein** (marca exibida ao usuário). O **repositório/monorepo** continua chamado **GymFlow** internamente — ver seção "Marca" abaixo.

---

## Marca: MeuTrein (produto) vs GymFlow (interno)

O produto foi rebrandado para **MeuTrein** mas o repositório, pacotes npm, storage keys e infraestrutura permanecem como `GymFlow`/`gymflow` para evitar quebrar sessões ativas e migrations de infra. **Não confundir as duas pontas.**

### Use "MeuTrein" (visível ao usuário)

- **Logos e nome em UI:** sempre via `<BrandLogo />` em `apps/web/components/layout/brand-logo.tsx`. Esse componente é um Link smart que redireciona pra `/dashboard` se houver sessão ou `/` se não — usar **sempre** em vez de logo manual.
- **Texto corrido em páginas:** landing, termos, privacidade, demo, not-found, auth pages, etc.
- **Metadata e SEO:** `title`, `siteName`, `openGraph`, `twitter`, `alt` da OG image — tudo em `app/layout.tsx` e `app/opengraph-image.tsx`.
- **Títulos do header do dashboard:** fallback em `components/layout/header.tsx`.
- **E-mails transacionais / comunicações:** futuras notificações, assinatura de e-mails, etc.

### Mantém "GymFlow"/"gymflow" (interno — NÃO trocar)

- **Pacotes npm do monorepo:** `@gymflow/web`, `@gymflow/database`, `@gymflow/ui`, `@gymflow/eslint-config`, `@gymflow/typescript-config`. Mudar exige refactor de todos os imports e republicação.
- **Workspace paths:** `tsconfig.json` paths apontam pra `@gymflow/*`.
- **Storage keys** (mudar **desloga todo mundo / apaga rascunhos / perde treinos offline** em prod):
  - `gymflow-auth` em `stores/auth-store.ts` (Zustand persist — sessão).
  - `gymflow_notifications` em `app/(dashboard)/configuracoes/page.tsx` (preferências de notificação).
  - `gymflow_draft_${userId}_${sheetId}[_d${day}]` em `app/(dashboard)/treinos/executar/[id]/page.tsx` (rascunho de treino em andamento).
  - `meutrein-offline` (IndexedDB database, **única key nova com prefixo MeuTrein** — pre-rebrand não existia). Stores: `sheets` (snapshots de ficha pra hidratar offline) e `pendingWorkouts` (queue de treinos finalizados aguardando sync). Definido em `apps/web/lib/offline-store.ts`. Renomear apaga todos os treinos offline pendentes.
- **Domínio `gymflow.app`** em `app/layout.tsx` (`metadataBase`, `openGraph.url`), `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` (pill bottom). Mudar exige novo domínio comprado + DNS/Vercel/SSL configurados antes.
- **E-mails do projeto:** `contato@gymflow.app`, `privacidade@gymflow.app`, `@gymflow` (twitter creator) — dependem do domínio.
- **Projeto Doppler:** `gymflow-s-org` em `.doppler.yaml`.
- **Comentários técnicos:** referências a "GymFlow Design System" em `globals.css` e similares são livres pra manter ou atualizar conforme conveniência.

### Como adicionar UI nova

- Logo? `<BrandLogo size="md" />`. Nunca crie um logo manual com `<Dumbbell />` + `Gym<span>Flow</span>` inline — esse padrão antigo foi extinto.
- Mostrar nome em texto corrido? "MeuTrein".
- Salvar algo em `localStorage`? Use a convenção existente (`gymflow_*`) **a menos que seja key nova** — pra keys novas, pode usar `meutrein_*` à vontade (sem risco de invalidar nada).
- Mexer em `metadataBase` / domínio? **Só com aprovação explícita** — afeta SEO, OG, callbacks Stripe, callbacks Supabase Auth, etc.

---

## Stack

- **Monorepo:** Turborepo + pnpm workspaces (Node ≥ 20, pnpm ≥ 9)
- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand, React Hook Form, Zod
- **Backend:** Supabase (Auth + PostgreSQL + Storage + Realtime)
- **Segurança:** Row Level Security (RLS) em todas as tabelas + rate limiting + Cloudflare Turnstile
- **Pagamentos:** Stripe (com webhook idempotente)
- **E-mail:** Resend
- **Envs:** Doppler (fonte da verdade)
- **Deploy:** Vercel

---

## Estrutura de pastas

```
/apps
  /web                          → app Next.js 15 (App Router)
    /app
      /(auth)                   → login, cadastro, convite, recuperar/redefinir senha, onboarding
      /(dashboard)              → dashboard, alunos, treinos, exercícios, frequência, agenda,
                                   evolução, histórico, configurações, perfil, personais, vídeos
      /api                      → routes server-side (webhooks, lookup, invites, turnstile, cnpj…)
    /components
      /ui                       → shadcn/ui base
      /layout                   → sidebar, bottom-nav, header
      /bioimpedance             → cards e formulários de composição corporal
      /charts                   → evolution-chart, frequency-heatmap
      /auth                     → social-buttons
    /lib
      /supabase/                → clients server/browser
      /rate-limit.ts            → limiters Upstash + fallback in-memory
      /turnstile.ts             → verifyTurnstileToken + clientIp
      /validations.ts           → schemas Zod compartilhados
      /stripe.ts, /cnpj.ts
    /stores                     → Zustand (auth-store, ui-store)
    /hooks
    /middleware.ts              → guard de sessão + PUBLIC_API_ROUTES allowlist
/packages
  /database                     → types.ts gerado via `pnpm db:types`
  /ui                           → componentes compartilhados
  /config                       → eslint/tsconfig compartilhados
/supabase
  /migrations                   → 001…039 + remote_schema (vai crescendo)
/scripts
```

Mais detalhe em [README do app web](apps/web) se existir; quando bater dúvida sobre onde fica algo, prefira `grep`/`glob` ao chute.

---

## Banco de dados — tabelas principais

```
academies           → dados da academia
academy_members     → vínculo user ↔ academia (role: owner | personal | student)
profiles            → perfil público do usuário
invites             → códigos e links de convite
exercises           → biblioteca de exercícios (global + por academia)
workout_sheets      → fichas de treino (personal → aluno)
sheet_exercises     → exercícios dentro de uma ficha
workout_logs        → sessões de treino realizadas
set_logs            → cada série executada (carga + reps)
```

---

## Regras de RLS — nunca ignorar

Toda query ao Supabase já é filtrada pelo RLS. As funções helper são:

```sql
get_user_academy_ids()   -- retorna academias do usuário logado
get_user_role(academy_id) -- retorna role do usuário em uma academia
```

**Regra de ouro:** nunca fazer query sem o contexto de `academy_id`. Um aluno jamais deve ver dados de outra academia.

### Pegadinhas de policy (3 brechas reais corrigidas na migration 069, jun/2026)

Padrões que passaram por revisão e viraram brecha crítica — não reintroduzir:

1. **RLS é por LINHA, não por coluna.** Policy de SELECT criada "pra expor só nome e slug" (migration 013) expunha a linha inteira de `academies` (cnpj, contato, stripe) pra anônimos. Se só algumas colunas podem ser públicas, sirva-as via API route com service_role — nunca via policy.
2. **Predicado sobre coluna ≠ filtro do request.** `using (... or token is not null)` é tautologia (toda linha tem token) — liberava a tabela `invites` inteira, até pra anônimos. O RLS não "sabe" qual token o cliente buscou no `.eq()`.
3. **`with check (auth.uid() = user_id)` em INSERT de tabela de vínculo = auto-promoção.** Em `academy_members`, qualquer autenticado podia se inserir como `owner` de qualquer academia. Insert de membro é exclusivamente server-side (RPC `accept_invite` + `/api/academy`, ambos service_role).

**Estado desde a 069:** lookup público de convite (por token OU código) é só via `GET /api/invites/lookup` (service_role + rate limit `invite`, resolve colisão de código entre academias). Client com anon key não lê `invites` — o SELECT é restrito a owner/personal da academia (dashboards).

---

## Convenções de código

### TypeScript
- Todos os tipos ficam em `/types/index.ts`
- Nunca usar `any` — se o tipo não existe, criar em `/types/index.ts`
- DTOs de criação têm sufixo `DTO` (ex: `CreateWorkoutSheetDTO`)

### Componentes React
- Componentes de página ficam em `/app`
- Componentes reutilizáveis ficam em `/components`
- Sempre tipar props explicitamente — nunca inferir via `any`
- Usar `shadcn/ui` antes de criar componente do zero

### Supabase
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no cliente
- Sempre usar o cliente público `supabase` no frontend
- Operações administrativas ficam em `/app/api` (server-side)
- Sempre tratar erros do Supabase — nunca assumir que a query funcionou

```ts
// ✅ correto
const { data, error } = await supabase.from('workout_sheets').select('*')
if (error) throw error

// ❌ errado
const { data } = await supabase.from('workout_sheets').select('*')
```

#### Paginação com `.range()` — pegadinha

`.range(start, end)` no Supabase é **inclusivo nas duas pontas**. Pra páginas de tamanho N:

```ts
// ❌ ERRADO: range(0, 10) traz 11 items, range(10, 20) duplica o item 10
.range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE)

// ✅ CORRETO opção A (simples — pede exatamente N items):
.range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

// ✅ CORRETO opção B (sentinel — pede N+1 pra detectar "tem mais"):
.range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE)
const hasMore = result.length > PAGE_SIZE
const visible = hasMore ? result.slice(0, PAGE_SIZE) : result
```

Bug já corrigido em `app/(dashboard)/historico/page.tsx`. Padrão B é o recomendado quando você precisa do "Carregar mais".

#### Query sem `.limit()` — truncamento silencioso em 1000 linhas

O PostgREST corta TODA resposta em 1000 linhas (`db.max_rows`) **sem erro nem aviso** — `select('created_at')` da tabela inteira retorna no máximo 1000 e o cliente conta errado. Sintoma real: "Total de treinos" e "Melhor sequência" congelavam após 1000 logs (corrigido na migration 070, jun/2026). Regra: contagem/agregação de tabela grande vai pra RPC com `COUNT(*)`/`GROUP BY` no banco — nunca baixar linhas pra contar no cliente. Bônus: derruba o tráfego por page view (capacidade de usuários simultâneos).

#### Dívida técnica — `(supabase as any).from(...)`

Existem **~90 ocorrências** de `as any` no codebase, das quais ~65 são `(supabase as any).from(...)`. Eram necessárias quando `packages/database/src/types.ts` estava stale; **hoje os types estão atualizados** (regenerados após migrations 040/041). A maioria desses casts **pode ser removida sem efeito funcional**, e fazer isso revela bugs de tipo que estão escondidos.

Para **código novo**: use `supabase.from('tabela')` direto, sem cast. Se `as any` for necessário, comente o motivo.

Para **limpeza retroativa**: ataque por categoria (queries → casts inline → outros), rodando `pnpm type-check` entre lotes.

#### Otimização do dashboard

`apps/web/app/(dashboard)/dashboard/page.tsx` — owner agora faz **1 chamada RPC** em vez das 14 queries originais.

**Já aplicado:**
- `_components.tsx` extraído (StatCard/QuickAction/EmptyState/AlertBanner + helpers) — HMR só recompila o arquivo mexido.
- `next/dynamic` em FrequencyHeatmap + StudentBioView (carregam só quando renderizam).
- `memo` nos 4 cards repetidos.
- `MotionConfig reducedMotion='always'` em dev.
- **RPC `get_owner_dashboard` (migration 056, out/2026):** consolida counts (students, personals, workouts week/last week, new this month, active this week, inactive, sem ficha) + arrays (recent_students, recent_workouts com profiles+sheet name embedded, inactive_students com last_workout_at, personais_perf com student_count). 14 → 1 roundtrip. Permission check `owner` embutido (`RAISE EXCEPTION OWNER_ONLY`).
- **RPC `get_personal_dashboard` (migration 057, out/2026):** trained_today_count, active_sheets_count, inactive_count, my_students[] (com last_workout_at + trained_today + active_sheets flag), recent_workouts[] (8 com student_name + sheet_name). 7 → 1 roundtrip. Check `p_personal_id = auth.uid()` + role in `personal`/`owner`.
- **RPC `get_student_dashboard` (migration 058, out/2026):** total/week_workouts, active_sheets, log_dates[] (cliente computa streak/heatmap/monthly localmente), last_workout, today_workout (com already_done de agenda_completions), next_workout (próximo dia futuro com ficha agendada). 9 → 1 roundtrip. Check `p_student_id = auth.uid()`.

Todas as 3 são SECURITY INVOKER, GRANT EXECUTE pra `authenticated`. Aplicadas em prod sem fallback — se uma falhar, dashboard daquele papel fica vazio até reload (log em `console.error('get_<role>_dashboard failed', ...)`).

**Como NÃO quebrar:** qualquer novo campo que o dashboard renderiza precisa **vir da RPC correspondente** — adicionar uma query Supabase paralela em `loadOwnerData`/`loadPersonalData`/`loadStudentData` reintroduz o problema. Alterar uma RPC exige nova migration (não editar 056/057/058), regen de types e ajustar o cast `as { ... }` no load.

#### Cache de listas globais

`apps/web/lib/global-cache.ts` (out/2026) — helper TTL via `localStorage` usado em `/receitas` (`recipes` + `food_items`) e `/exercicios` (`exercises`). TTL padrão 5min via `CACHE_TTL.GLOBAL_LIST`. Skip total da query quando cache fresco — economia direta de conexão Supabase.

- **Chaves incluem `academy_id`** (ex: `recipes_<academy_id>`) pra evitar leakage cross-tenant. Catálogos com `is_global=true` aparecem na lista mas o cache é por-academia mesmo assim.
- **Após escrita local** (callback `onCreated` em `NewRecipeModal`/`NewExerciseModal`), chamar `setCached(key, updatedArray)` junto com `setState(updatedArray)`. Não usar `setState((prev) => [...prev, x])` aqui — o cache não vê o setter funcional.
- **Bump `CACHE_VERSION`** em `global-cache.ts` quando o shape dos dados mudar (campos novos em migration) pra invalidar payloads velhos sem precisar limpar localStorage manualmente.
- **NÃO cachear dados variáveis por tenant** (alunos, treinos, planos, set_logs) — staleness aí é vazamento de UX (aluno não vê próprio treino que acabou de logar).

### Zustand
- Store global apenas para: usuário logado, `academy_id` ativo e `role`
- Estado de UI (loading, modal aberto) fica local com `useState`
- Nunca guardar dados do banco no Zustand — use React Query ou SWR

### Nomenclatura
- Arquivos: `kebab-case` (ex: `workout-sheet-form.tsx`)
- Componentes: `PascalCase` (ex: `WorkoutSheetForm`)
- Funções e variáveis: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Tabelas no banco: `snake_case`

---

## Variáveis de ambiente

**Fonte da verdade é o Doppler.** Rodar com `doppler run -- pnpm --filter @gymflow/web dev` pega tudo automaticamente.

`.env.example` lista as chaves esperadas mas usa **placeholders truthy** (ex: `https://...upstash.io`) para documentação. Código que confia em `!process.env.X` para detectar ausência **vai quebrar com esses placeholders** — sempre valide formato/conteúdo, não só presença (ver `lib/rate-limit.ts` → `hasValidUpstashEnv()`).

### `NEXT_PUBLIC_*` — sempre notação de ponto (pegadinha do build Vercel)

Variáveis `NEXT_PUBLIC_*` **devem** ser lidas como `process.env.NEXT_PUBLIC_X` (ponto), **nunca** `process.env['NEXT_PUBLIC_X']` (colchete). O Next.js faz o inlining estático no build só na forma com ponto; com colchete o valor **não é substituído** e fica `undefined` no browser e na **Edge middleware** em produção (no `next dev` funciona porque o Node lê `process.env` em runtime). Sintoma clássico: `Your project's URL and Key are required to create a Supabase client!` no `middleware.ts` só no deploy Vercel, nunca local.

O `tsconfig` tem `noPropertyAccessFromIndexSignature: true`, que normalmente obrigaria colchete. Para liberar a notação de ponto, as chaves `NEXT_PUBLIC_*` estão declaradas como propriedades nomeadas em `ProcessEnv` no arquivo `apps/web/types/env.d.ts` — **adicione toda nova var `NEXT_PUBLIC_*` lá** antes de usá-la com ponto. Vars server-side (sem `NEXT_PUBLIC_`) continuam com colchete (rodam só no Node, onde `process.env` existe em runtime).

```ts
// ✅ certo (inlined no build → funciona no browser e na Edge)
createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, ...)

// ❌ errado (undefined em produção no browser/Edge)
createServerClient(process.env['NEXT_PUBLIC_SUPABASE_URL']!, ...)
```

Pré-requisito de deploy: as `NEXT_PUBLIC_*` precisam estar setadas no painel da Vercel (Environment Variables → Production). Como são "assadas" no build, **qualquer alteração delas exige um novo deploy** — mudar a var e só dar reload não pega.

Chaves principais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=               # server-side

# Stripe
STRIPE_SECRET_KEY=                       # server-side
STRIPE_WEBHOOK_SECRET=                   # server-side
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Cloudflare Turnstile (anti-bot em rotas públicas)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=                    # server-side

# Upstash Redis (rate limiting — opcional, faz fallback in-memory)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Integrações
GOOGLE_PLACES_API_KEY=                   # server-side
RESEND_API_KEY=                          # server-side
```

Variáveis sem `NEXT_PUBLIC_` nunca chegam ao cliente. Se precisar no frontend, expor via API route.

**Cross-platform:** dev Windows + Linux. Scripts/comandos precisam funcionar em ambos (bash + paths relativos, sem hardcode de `/home/...` ou `C:\...`).

---

## Segurança em camadas

A app tem 4 camadas defensivas — não atalhe nenhuma:

1. **RLS no Postgres** — primeira e última linha. Toda tabela tem RLS habilitada; políticas em `supabase/migrations/002_rls_policies.sql` e revisões posteriores (`025_consolidate_permissive_policies.sql` consolida SELECTs em policies únicas por tabela).
2. **Middleware de sessão** (`apps/web/middleware.ts`) — protege rotas autenticadas. Mantém `PUBLIC_API_ROUTES` allowlist explícita (`/api/auth/lookup`, `/api/turnstile`, `/api/invites/lookup`, `/api/webhooks/stripe`) e `PUBLIC_PREFIXES` (`/convite/`, `/auth/callback`). API protegida sem sessão → 401 JSON (não redirect).
3. **Rate limiting** (`apps/web/lib/rate-limit.ts`) — **in-memory, janela fixa, sem Upstash** (reintroduzido jun/2026 após o Upstash ter sido removido num refactor). API: `rateLimit(key, rule)` → `{success, retryAfterSec}` + helper `tooManyRequests()`. Regras nomeadas em `RATE_LIMITS`: `auth` (20/15min), `invite` (30/5min), `checkDocument` (15/5min), `sendEmail` (5/10min — protege quota do Resend). Ligado em: `check-document`, `auth/lookup`, `invites/lookup|accept|create`, `auth/send-verification`. Key por IP (`clientIp(request)`) nas públicas, por `user.id` nas autenticadas (ex: invite-create). **Limitação conhecida:** cada instância serverless tem seu próprio Map → sob escala horizontal o limite é N× mais frouxo. Pro 1º cliente corta abuso trivial; pra escala real, trocar a impl por Upstash (interface `rateLimit()` é drop-in). **Histórico:** limites originais 5/15min bloqueavam usuários legítimos (jun/2026) — as regras atuais são folgadas de propósito. Versões antigas usavam Upstash com `hasValidUpstashEnv()` + alerta fatal no Sentry; isso não existe mais.
4. **Cloudflare Turnstile** (`apps/web/lib/turnstile.ts`) — obrigatório em rotas públicas de auth e lookup. Validação server-side via `verifyTurnstileToken()`. Em `NODE_ENV !== 'production'` com secret ausente, gate permissivo (só pra dev local sem Doppler).

Toda rota nova de auth/lookup pública precisa passar pelas 4 camadas. Mensagens de erro normalizadas pra evitar enumeração (ex: "Credenciais inválidas" cobre user-not-found E senha errada).

---

## Multi-tenant — regras críticas

1. **Todo insert precisa de `academy_id`** — sem exceção
2. **Todo select já é filtrado pelo RLS** — mas sempre incluir `.eq('academy_id', academyId)` explicitamente para clareza
3. **Ao criar uma academia**, inserir o usuário em `academy_members` com `role: 'owner'` na mesma transação
4. **Convites expiram** — sempre checar `expires_at` e `used` antes de processar. Desde 2026-06-11: `POST /api/invites/create` aplica default de **30 dias** quando `expiresAt` é omitido; `null` explícito continua significando "nunca expira" (opção dos modais de alunos/personais). Códigos novos têm **8 caracteres** (eram 6); inputs de código (`/codigo`, onboarding) aceitam 6 OU 8 pra não quebrar convites antigos.

```ts
// Exemplo de insert seguro
const { error } = await supabase
  .from('workout_sheets')
  .insert({
    academy_id: academyId,    // sempre explícito
    student_id: studentId,
    personal_id: user.id,
    name: 'Treino A',
    goal: 'Hipertrofia',
  })
```

---

## Planos / tenancy — 3 tipos de owner

O enum `academy_plan` (Postgres) aceita: `free | personal | starter | pro`. A migration `042_academy_plan_personal.sql` adiciona `'personal'`. **Owner do tenant = quem assinou o plano**, não importa se é academia ou personal trainer solo.

| Plan | Preço | Quem é | Sub-personais | Limite alunos |
|---|---|---|---|---|
| `personal` | R$ 97/mês | Personal trainer solo (próprio tenant) | ❌ não tem | ilimitado |
| `starter` | R$ 197/mês | Academia pequena | até 3 | até 50 |
| `pro` | R$ 397/mês | Academia | ilimitado | ilimitado |
| `free` | — | Trial / pré-pagamento | n/a | n/a |

**Confusão recorrente:** `role` (`owner | personal | student`) e `plan` (`personal | starter | pro`) compartilham a palavra "personal" mas significam coisas diferentes:
- `role === 'personal'` → **sub-personal** que trabalha pra um owner em academia starter/pro.
- `plan === 'personal'` → **personal trainer solo**, role no banco é `'owner'` (do próprio mini-tenant).

**Esconder "sub-personais" quando `plan === 'personal'`:** o personal solo é o único treinador, então tudo que pressupõe múltiplos personais some. Toda entrada pra `/personais` ou `/relatorios` precisa do gate `currentAcademy?.plan !== 'personal'` — checar os 5 pontos ao mexer:
- `apps/web/components/layout/sidebar.tsx` (`PERSONAL_PLAN_HIDDEN_HREFS` esconde `/personais` e `/relatorios`).
- `apps/web/app/(dashboard)/dashboard/page.tsx` (`isPersonalPlan` esconde card "Personais ativos" + QuickActions "Convidar personal" e "Relatórios").
- `apps/web/app/(dashboard)/alunos/page.tsx` (botão "Gerenciar personais" no header).
- `apps/web/app/(dashboard)/personais/page.tsx` (guard `if (isPersonalPlan)` na própria página — rede de segurança pra acesso direto por URL).
- `apps/web/app/(dashboard)/relatorios/page.tsx` (mesmo guard `if (isPersonalPlan)` — adicionado jun/2026; o `useEffect` também pula as RPCs nesse caso).

**Substituto pro solo (jun/2026):** no plano Personal, "Frequência" entra no lugar de "Relatórios" — a visão academia de `/frequencia` (RPC `get_frequency_stats` com `p_student_id` null) É a frequência dos alunos dele, já que ele é o único treinador. Três pontos que sustentam isso:
- `apps/web/app/(dashboard)/frequencia/page.tsx` — redirect owner → `/relatorios` NÃO se aplica quando `plan === 'personal'`.
- `apps/web/components/layout/sidebar.tsx` — item "Frequência" com `roles: ['owner']` aparece só quando `isPersonalPlan` (filtro em `filteredNav`).
- `apps/web/components/layout/bottom-nav.tsx` — `OWNER_ITEMS` já tinha "Frequência" pra todo owner (starter/pro continua redirecionando pra `/relatorios`).

### Banner de cobrança pendente (jun/2026)

`apps/web/components/layout/billing-banner.tsx`, montado no `(dashboard)/layout.tsx` acima do conteúdo. Só `role === 'owner'` vê; oculto em `/configuracoes`. Estados: sem `subscription_status` + plano pago + sem `stripe_subscription_id` (checkout abandonado, âmbar), `past_due` (vermelho), `canceled` (vermelho). CTA → `/configuracoes?tab=plano`. **Não bloqueia o uso** — paywall duro é decisão de produto pendente. Em dev (bypass de Stripe) o banner aparece pra toda academia criada, por design: reflete o estado real do banco.

### Bypass de Stripe em dev/test

`apps/web/app/api/academy/route.ts` e `apps/web/app/api/academy/upgrade/route.ts` pulam o Stripe checkout quando `NODE_ENV !== 'production'` OU `SKIP_STRIPE_CHECKOUT=true`. Em dev: cria/atualiza academia direto no banco com o plano escolhido e redireciona pro dashboard, sem cobrança. Em prod: sempre passa pelo Stripe. Útil pra testar fluxo dos 3 planos sem configurar Price IDs.

---

## Roles e permissões

| Ação | owner | personal | student |
|---|---|---|---|
| Ver alunos da academia | ✅ | ✅ (só os seus) | ❌ |
| Criar ficha de treino | ✅ | ✅ | ❌ |
| Executar treino | ❌ | ❌ | ✅ |
| Gerar convites | ✅ | ✅ | ❌ |
| Ver dados da academia | ✅ | ❌ | ❌ |
| Gerenciar personais | ✅ | ❌ | ❌ |

Sempre checar role antes de renderizar ações sensíveis:

```ts
const { role } = useAuthStore()

if (role === 'owner') {
  // mostrar painel de configurações
}
```

---

## Padrões de UI

- **Componentes base:** sempre usar shadcn/ui (`Button`, `Input`, `Card`, `Badge`, `Dialog`).
- **Ícones:** Lucide React, outline, 20-24px.
- **Logo:** sempre via `<BrandLogo size="..." />` em `apps/web/components/layout/brand-logo.tsx`. Link smart auto-decide destino (`/dashboard` se logado, `/` se não). Nunca recriar logo manual.
- **Mobile-first:** toda tela deve funcionar em 375px.
- **Estado vazio:** sempre ter ícone + mensagem + botão de ação.
- **Loading:** usar skeleton (`components/ui/skeleton.tsx`), nunca spinner sozinho em tela cheia.
- **Inputs numéricos no mobile:** sempre passar `inputMode` junto com `type="number"`. Use `"decimal"` para pesos/medidas/percentuais e `"numeric"` para inteiros (reps, idade). Sem isso, o aluno suado registrando carga pega teclado QWERTY.
- **Scroll horizontal mobile:** quando usar `overflow-x-auto` em tabs/filtros, esconder a scrollbar nativa (`[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`) e adicionar gradient fade na borda direita pra indicar conteúdo cortado (ver `app/(dashboard)/configuracoes/page.tsx`).

### Paleta e regra de cor (sistema vigente)

| Papel | Cor | Onde usar |
|---|---|---|
| **Brand / ação primária** | `brand-500` `#6366F1` (indigo) | Sidebar active, logo, links de navegação, **botões `btn-primary`**, CTAs principais da landing, badges informativos, charts |
| **Destaque secundário** | gradient `brand-500 → cyan-500` | Badge "⚡ Mais popular" no pricing, elementos que precisam saltar mais |
| **Sucesso** | `emerald-500` `#10b981` | Confirmações, estado "concluído", treinos completos |
| **Aviso / conquista** | `amber-400/500` `#fbbf24/#f59e0b` | Streak ativa, recordes pessoais (PR), `Trophy` icon, alertas suaves |
| **Erro/destrutivo** | `rose-500` / destructive | Erros, remoção, cancelamento |

**Histórico:** chegamos a testar amber-700 como cor de ação primária (laranja queimado, "fitness BR") em out/2026. Resultado: contraste técnico OK mas perda de nitidez perceptiva nas letras + estética destoava do resto. Revertido. Se quiser reabrir esse experimento, considere reduzir glow e aumentar font-weight do botão antes de descartar.

**`btn-primary` (em `globals.css`)** está em `bg-brand-500` + glow indigo. Mudar a definição centralmente atualiza ~62 botões no app inteiro de uma vez.

### PWA / manifest

Setup PWA completo via `@ducanh2912/next-pwa` (configurado em `apps/web/next.config.ts` wrappeando o `nextConfig` antes do Sentry).

- **Manifest:** `apps/web/public/manifest.json` — id, scope, shortcuts (Treinos/Agenda/Histórico), 4 entradas de ícones (192/512 + maskable).
- **Service worker:** gerado automaticamente no `next build` (output em `public/sw.js`). Desabilitado em dev pra não conflitar com HMR/Sentry.
- **Estratégia de cache (crítica multi-tenant):**
  - Supabase, Stripe, `/api/*` → `NetworkOnly` (NUNCA cachear — dado de outro tenant cacheado é vazamento).
  - Imagens (png/jpg/svg/webp/ico/avif) → `CacheFirst` com expiração 30d.
  - Bundles JS/CSS/fonts → `StaleWhileRevalidate`.
  - HTML autenticado: não está em `runtimeCaching`, então respeita o default do Workbox sem cache de página.
- **iOS:** `metadata.appleWebApp` + `apple-touch-icon.png` (180x180) em `public/`. iOS ignora `manifest.json` parcialmente.
- **Install UX:** `components/pwa/install-button.tsx` escuta `beforeinstallprompt` (Android/Chrome/Edge) e exibe bottom sheet com instrução manual no iOS. Detecta `display-mode: standalone` pra esconder quando já instalado.
- **CSP:** `worker-src 'self' blob:` + `manifest-src 'self'` adicionados em `next.config.ts` pra registrar o SW.

**Ícones PWA: ✅ resolvidos (jun/2026).** Os 4 PNGs existem em `apps/web/public/icons/` (192/512 + maskable, validados como PNG reais) e o apple-touch-icon é gerado dinamicamente por `app/apple-icon.tsx` (Next file-convention, 180x180). **Pendente só:** testar em produção com Lighthouse PWA audit (precisa HTTPS — Vercel já dá).

**Offline da execução de treino (out/2026):** funcional. Arquitetura em 3 camadas — ver seção "Execução de treino" abaixo. Resumo: shell HTML cacheado via Workbox `NetworkFirst` em `/treinos/executar/*`, snapshot da ficha em IndexedDB (`meutrein-offline.sheets`) gravado em todo load online, fila `pendingWorkouts` drenada pelo `useOnlineSync` no `online` event. Supabase **continua `NetworkOnly`** — nenhum dado de tenant é servido do cache (segurança multi-tenant intacta).

**O que NÃO está cacheado offline ainda:** páginas Histórico, Evolução, Frequência. Aluno offline só consegue executar treino (caso prometido pela landing); navegação no resto do app exige conexão.

---

## Fluxos críticos — não quebrar

### Login e cadastro por papel (jun/2026)

- **CREF é OPCIONAL no cadastro do personal** (era obrigatório). Se preenchido, valida formato + pre-check de duplicidade; se vazio, `signUp` normaliza pra `null` (NUNCA gravar `''` em `profiles.cref`/`cpf` — índice UNIQUE parcial só ignora NULL, string vazia colide no 2º cadastro sem documento).
- **Login do personal aceita CREF OU e-mail** no mesmo campo: valor com `@` ou começando com letra → login direto por e-mail (caminho do aluno, com Turnstile); valor numérico → máscara CREF + lookup `/api/auth/lookup`. Não aplicar `maskCREF` em valor que parece e-mail (a máscara remove `@`/`.`).
- **Conta de aluno não vira personal independente**: o seletor de papel do onboarding esconde o cartão "Sou personal trainer" quando `account_type === 'student'`. Personal entra pelo `/cadastro` ou por convite de academia.
- **Login social (Google) sempre entra como aluno** (`auth/callback` força `account_type: 'student'`). Donos e personais entram por credenciais.

### Login social — branding do consent screen (TODO, config externa)

A tela do Google mostra "para continuar em `<projeto>.supabase.co`". Dois passos pra mostrar MeuTrein (nada disso é código deste repo):
1. **Google Cloud Console → OAuth consent screen:** App name "MeuTrein" + logo + domínio autorizado — muda o nome exibido no topo. Grátis, fazer já.
2. **Supabase Custom Domain** (add-on pago): aponta auth pra um domínio próprio (ex: `auth.gymflow.app`) — é o único jeito de sumir o `supabase.co` da URL exibida. Exige atualizar o redirect URI no Google Console e o Site URL no Supabase.

### Cadastro de academia
```
CNPJ → ReceitaWS → preenche dados → Google Places → confirma → cria academia + membro owner
```

**Pegadinha resolvida (out/2026):** o fluxo `/cadastro` → `signUp` → `/onboarding` → `/api/academy` deixa **auth.user órfão** se a criação da academia falha (ex: CNPJ duplicado). O user fica zombiado com CNPJ no metadata mas sem academia, bloqueando todas as tentativas futuras com o mesmo CNPJ. Fix em 3 camadas:

1. **Pre-check no `/cadastro`** chama `POST /api/check-document` ANTES do signUp. Bloqueia se CNPJ/CREF já tem conta, mostra email mascarado e sugere login.
2. **Cleanup automático em `/api/academy`** — quando insert da academia bate em 23505 cnpj, chama `admin.auth.admin.deleteUser()` ANTES de retornar 409. Remove o auth.user que acabou de ser criado.
3. **`/api/check-document`** (rota pública na allowlist do middleware): rate-limited, sem Turnstile, retorna `{exists, masked_email?}`. Reusa lógica de varredura academias.cnpj + fallback auth.users.metadata do `/api/auth/lookup`.

Se vir auth.users com `account_type='owner'` E sem academia vinculada, é órfão de uma versão antiga. Migration `063_cleanup_orphan_owner.sql` faz limpeza idempotente (safety: só toca em users com mais de 1h de idade pra não pisar em signup ativo).

### Exclusão de conta (jun/2026)

Botão "Excluir minha conta" na Zona de perigo do perfil (`app/(dashboard)/perfil/page.tsx`), pros 3 papéis. Chama `POST /api/account/delete` (service_role) que libera **e-mail / CNPJ / CREF pra reuso imediato** num novo cadastro. **A ordem dos passos importa por causa das FKs** (migration 001):

1. Deleta `academies WHERE owner_id = user` — `academies.owner_id` é **ON DELETE RESTRICT**, então tem que sair ANTES do deleteUser. Antes, cancela a assinatura Stripe (best-effort, não-fatal). O delete cascateia membros/fichas/treinos/convites/agenda/bio/dietas e **libera o CNPJ** (`academies.cnpj`).
2. Zera as refs **NO ACTION** que sobram apontando pro user (senão o deleteUser falha por FK): `academy_members.invited_by` + `created_by` em `exercises`/`recipes`/`food_items` (catálogo global criado por ele).
3. `admin.auth.admin.deleteUser` — remove auth.users (**libera e-mail + `user_metadata.document`**), cascateia `profiles` (**libera CREF de `profiles.cref`**) + memberships + histórico de treino.

**Por que reuso funciona:** `check-document`/`auth/lookup` varrem `academies.cnpj`, `profiles.cref` e `user_metadata.document` — os 3 somem nos passos acima. **Se adicionar nova FK pra `auth.users` SEM cascade**, incluir no passo 2 ou o deleteUser quebra. Cliente faz `signOut` + `window.location='/'` no sucesso.

### Entrada do aluno
```
Link /convite/[code] → valida código (não expirado, não usado) → cria user → cria academy_member → marca convite como usado
```

### Execução de treino

Fluxo feliz online:
```
Cria workout_log → para cada série confirmada, cria set_log → ao finalizar, RPC complete_workout (atômico)
```

**Suporte offline (out/2026):** o aluno na academia com sinal fraco precisa abrir, executar e finalizar a ficha sem internet. Implementado em 3 camadas em cima da RPC idempotente:

1. **Shell HTML cacheado** — `next.config.ts` tem `NetworkFirst` (timeout 3s) pra `/treinos/executar/*`. Aluno consegue navegar pra rota mesmo offline; HTML é estático (Supabase fetch acontece client-side só, sem leakage cross-tenant).

2. **Snapshot da ficha em IndexedDB** — `apps/web/lib/offline-store.ts`. Quando o load Supabase retorna OK, o page grava `{userId, sheetId, day, exercises, prMaxWeights}` no store `sheets`. Key composta `[userId, sheetId, day]` evita troca entre usuários no mesmo device. Se o load falha (offline ou Supabase down), tenta `getCachedSheet()` — achou snapshot do mesmo userId+sheetId+day, hidrata.

3. **Queue de set_logs em IndexedDB** — store `pendingWorkouts` com chave `clientId` (UUID). Quando aluno finaliza:
   - `navigator.onLine` true: chama RPC `complete_workout` direto (caminho normal).
   - `navigator.onLine` false **ou** RPC falha: `queueWorkout()` em vez de mostrar erro. Aluno vê toast "Treino salvo localmente".
   - Hook `useOnlineSync` (`apps/web/hooks/use-online-sync.ts`) escuta `window.online` + drena na montagem se já estiver online. Pra cada item, refaz a RPC com o mesmo `clientId` — idempotência da migration 028 garante que retry não duplica.

**UI de status:** `apps/web/components/layout/offline-sync-provider.tsx` monta banner topo no `(dashboard)/layout.tsx`. Âmbar quando offline, indigo quando há queue mas online (sincronizando), some quando tudo OK.

**Limitações conhecidas:**
- Aluno que **nunca** abriu a ficha online vê "Ficha não encontrada" quando tenta offline. Snapshot só cobre fichas já visitadas.
- Se o personal edita a ficha enquanto aluno está offline, aluno usa a versão velha até reabrir online (atualiza no próximo load OK).
- Sem Background Sync API (escolha consciente — `online` event listener cobre 95% dos casos e é simpler).

**Como NÃO quebrar:** qualquer mudança na RPC `complete_workout` precisa **preservar a idempotência por `client_id`** — sem isso a queue duplica workout_log no retry. Qualquer novo campo na ficha que execução precisa ler precisa entrar no `SheetSnapshot` em `lib/offline-store.ts`, senão a hidratação offline mostra estado parcial.

Esses três fluxos são o coração do produto. Qualquer mudança neles precisa de atenção redobrada.

---

## RPCs críticas (SECURITY INVOKER)

Operações que precisam de atomicidade vivem em RPCs Postgres, não em código de aplicação:

- **`complete_workout(client_id, exercises, ...)`** — `028_complete_workout_rpc.sql`. Salva treino + set_logs em transação única. Idempotência via `client_id` (UUID gerado no draft do cliente) + unique partial index em `workout_logs.client_id`. Substitui o INSERT múltiplo do client que era propenso a estado parcial.
- **`list_academy_students(p_academy_id, p_search, p_status, p_limit, p_offset)`** — `029_list_academy_students_rpc.sql`. Consolida `academy_members + profiles + workout_logs(agg) + workout_sheets(agg)` numa query só, com search via `extensions.unaccent + ILIKE`, paginação e `total_count`. Permission check owner/personal embutido. Substitui o N+1 + mentira-de-UI antigo.
- **`accept_invite(p_token, p_user_id)`** — `030_accept_invite_rpc.sql`. `FOR UPDATE` lock + check de `uses_limit` pré-incremento + idempotência por `(academy, user)`. Erros nomeados: `INVITE_UNAVAILABLE`, `EXPIRED`, `EXHAUSTED`, `INVALID_ROLE`. **GRANT só para `service_role`** — chamada exclusivamente do API route, nunca do client.
- **`get_owner_dashboard(p_academy_id, p_week_ago, p_two_weeks_ago, p_month_ago)`** — `056_get_owner_dashboard_rpc.sql`. Retorna jsonb com todas as métricas + arrays do dashboard do owner. Permission check `'owner'` no início (`RAISE EXCEPTION OWNER_ONLY`). GRANT EXECUTE pra `authenticated` (RLS aplicada via `SECURITY INVOKER`).
- **`get_personal_dashboard(p_academy_id, p_personal_id, p_week_ago, p_today_start)`** — `057_get_personal_dashboard_rpc.sql`. Personal vê só os alunos que ele convidou (filtro `invited_by`). Permission: `p_personal_id = auth.uid()` AND role in (personal, owner).
- **`get_student_dashboard(p_academy_id, p_student_id, p_week_ago, p_today_start, p_today_date, p_today_index)`** — `058_get_student_dashboard_rpc.sql`. Aluno vê só os próprios dados. Permission: `p_student_id = auth.uid()`. `p_today_date` (date) é separado pra evitar timezone drift em `agenda_completions.completed_on`.
- **`get_student_evolution_summary(p_academy_id, p_student_id, p_since)`** — `059_get_student_evolution_summary_rpc.sql`. Load inicial de `/evolucao` em 1 roundtrip: `weekly_logs` (workouts completos + set_logs aninhados pra cálculo client-side de volume semanal) + `exercises` distintos com peso > 0 pra picker. Permission `p_student_id = auth.uid()`. Bucketização semanal fica no cliente (timezone-safe).
- **`get_frequency_stats(p_academy_id, p_student_id, p_week_start, p_month_start, p_year_ago, p_tz)`** — `070_frequency_reports_rpcs.sql` (jun/2026). `/frequencia` em 1 roundtrip: counts + best streak (gaps-and-islands) + `week_dows` + `log_days` (heatmap, count por dia local, ≤366 entradas). `p_student_id` null = visão academia (exige owner/personal); senão precisa ser `auth.uid()`. `p_tz` = IANA do browser pra dia local. Substitui 3 queries unbounded.
- **`get_academy_reports(p_academy_id, p_week_start, p_prev_week_start, p_month_start, p_year_ago, p_tz)`** — `070_frequency_reports_rpcs.sql` (jun/2026). `/relatorios` em 1 roundtrip (+ `academy_engagement_weekly` que já existia): counts, streak, `workouts_by_day[7]`, `top_students` (nome já resolvido) e `log_days`. Check owner/personal. Substitui 6 queries + lookup de profiles. `FrequencyHeatmap` agora aceita prop `days` (`{d, c}[]`) além de `timestamps`.

Webhook Stripe (`apps/web/app/api/webhooks/stripe/route.ts`) usa claim atômico via `upsert ON CONFLICT DO NOTHING RETURNING` em `processed_events` + rollback do registro no `catch` (Stripe retenta evento se o handler subir).

---

## O que não fazer

- **Não criar componentes de UI do zero** se existe no shadcn/ui
- **Não criar logo manual** — use `<BrandLogo />` (link smart já configurado)
- **Não usar `localStorage` para dados do usuário** — usar Supabase Auth session (keys atuais `gymflow_*` são pra drafts/preferências e estão documentadas em [Marca: MeuTrein vs GymFlow])
- **Não fazer queries sem tratamento de erro** (`{ data, error }`, sempre desestruturar e checar `error`)
- **Não usar `.range(start, end)` esperando comportamento half-open** — Supabase é inclusivo (ver seção Supabase)
- **Não expor chaves de API no cliente**
- **Não fazer redirect no middleware sem checar o role** — aluno não pode acessar `/dashboard` de owner
- **Não remover `academy_id` de nenhuma tabela** — quebra o isolamento multi-tenant
- **Não usar `useEffect` para buscar dados** — usar React Query ou server components (29 arquivos hoje violam — débito técnico, refator grande)
- **Não adicionar novos `as any` sem comentário** justificando — types do Supabase estão atualizados, cast normalmente não é necessário

---


## Migrations

**Estado em 2026-06-13:** prod sincronizado até a `073`. As migrations `068`/`069`/`070` (que estavam pendentes — a 069 fechava 3 brechas críticas de RLS) foram aplicadas via `supabase db push` + `db:types` + `type-check` OK. As brechas de RLS não existem mais.

**Colisão de número 071 resolvida (jun/2026):** havia DUAS migrations `071` (`071_email_verification` — aplicada — e `071_plan_limits_in_accept_invite` — nunca aplicada). Número duplicado trava o `db push` inteiro (`schema_migrations_pkey` duplicate key). Fix: `plan_limits` renumerada pra `072`, e a nova `bioimpedance_goals` pra `073`. **Regra: nunca reusar número de migration** — checar o maior número existente antes de criar.

**Pegadinha `uuid_generate_v4()` (jun/2026):** migrations antigas (007) usam `uuid_generate_v4()`, mas no push atual ele não está no search_path (`function does not exist`, SQLSTATE 42883). **Use `gen_random_uuid()`** (built-in no Postgres do Supabase) em PK default de tabela nova.

**Metas de bioimpedância (jun/2026):** tabela `bioimpedance_goals` (1 meta ativa por aluno: `metric` + `target_value` + `start_value` baseline). Personal define em `components/bioimpedance/bioimpedance-section.tsx`; aluno vê o progresso em `student-bio-view.tsx`. Barra de progresso compartilhada em `components/bioimpedance/goal-progress.tsx` (`computeGoalProgress` = (atual−start)/(alvo−start), cobre perder E ganhar; animação escala por faixa: start/half/close/done). RLS espelha `bioimpedance_assessments`.

Toda mudança no banco vira um arquivo novo em `supabase/migrations/`. Numeração sequencial (`001…039`) + arquivos `<timestamp>_remote_schema.sql` quando se faz `supabase db pull`.

Atalhos no `package.json` da raiz:
- `pnpm db:push` — aplica migrations locais no projeto linked (CUIDADO: hoje aponta pra prod)
- `pnpm db:reset` — reseta DB local
- `pnpm db:types` — regenera `packages/database/src/types.ts` (rodar após toda migration que cria/altera tabela ou RPC)

**Regras:**
- Nunca editar uma migration já aplicada em produção — sempre criar uma nova. **Única exceção registrada:** `065_reset_test_owners.sql` (DML destrutivo one-time, sem efeito de schema) foi neutralizada em jun/2026 pra que o replay do chain em ambiente novo não delete dados — o estado de prod não muda com isso.
- Toda RPC com lado-efeito sensível: `SECURITY INVOKER` + permission check explícito, NÃO `SECURITY DEFINER` solto
- Sempre regenerar `types.ts` após mexer no schema — sem isso o front cai em `as any`

---

## Contexto de negócio

- **Cliente pagante é a academia** — aluno nunca paga diretamente
- **Churn acontece quando o aluno não engaja** — UX do aluno é a mais crítica
- **Personal trainer é o usuário mais ativo** — a ferramenta de criação de fichas precisa ser rápida
- **Pequenas academias são o ÚNICO target** — produto não é para redes/franquias/grandes academias. Ver "Tom de voz e copy" abaixo.
- **Mobile-first porque o aluno usa na academia** — durante o treino, com as mãos suadas

---

## Tom de voz e copy (landing, e-mails, onboarding)

Toda comunicação com o usuário deve refletir o foco em **pequenas academias** — donos que tocam o negócio pessoalmente, personal trainer único ou pequeno time, dezenas (não centenas/milhares) de alunos.

### Use

- Linguagem **direta, próxima e prática.** "Sua academia", "seus alunos", "seu personal" — em vez de termos genéricos/corporativos.
- Benefícios **concretos no dia a dia da pequena academia:** "Crie ficha em 2 minutos", "Veja quem está sumindo", "WhatsApp do aluno na mão", "Sem precisar de TI". Sempre vinculado a tarefa real.
- Provas **honestas e proporcionais:** depoimentos reais, prints de tela do produto, número de exercícios na biblioteca, número de planos disponíveis.
- Comparações **com a alternativa real da pequena academia:** planilha do Excel, caderno, grupo de WhatsApp — não com Mindbody ou ClassPass.
- **Preços visíveis** e bem abaixo de soluções enterprise — pequena academia tem orçamento apertado.

### Não use

- **Claims inflados ou falsos:** "Mais de 500 academias", "+10 mil personais", "milhões de treinos registrados". Se não tem o número, não escreva. Se tem mas é pequeno, mostre com orgulho ("As primeiras academias já estão usando" > inventar 500).
- **Jargão enterprise/SaaS B2B:** "nível enterprise", "escalável", "infraestrutura cloud-native", "ROI", "compliance corporativa". Pequeno dono de academia não fala assim e não compra esses termos.
- **Promessas vagas:** "Transforme sua academia", "Revolucione seu negócio". Cada frase deve ter substantivo concreto + verbo concreto.
- **Selo de "grande coisa":** badges falsos, certificados não-existentes, logos de "como visto em…" inflados.
- **Mencionar features que não temos:** se algo está em roadmap, mantém em roadmap. Não vender o que não existe.

### Régua simples

Antes de aprovar qualquer copy nova, pergunte: **"Um dono de uma academia com 40 alunos no bairro lendo isso entende, acredita e vê valor?"** Se a resposta exigir "ele vai precisar de alguém pra explicar", reescreve.

---

## Política de Documentação (CLAUDE.md)

Este arquivo é a **memória persistente do projeto** lida no início de toda sessão. Sua qualidade dita o nível do trabalho a partir do próximo prompt. Regras pra manter.

### Quando ATUALIZAR

Atualize `CLAUDE.md` na **mesma sessão** em que algo abaixo acontecer — não deixe pra depois:

1. **Nova dependência ou padrão de stack** (ex: `next-pwa`, novo limiter, troca de lib de chart). Inclui versão se for relevante.
2. **Decisão arquitetural** (ex: "drafts em localStorage", "RPCs SECURITY INVOKER em vez de DEFINER"). Sempre com o **porquê** — sem o motivo, a regra vira culto-cargo.
3. **Pegadinha de API/lib** que pode reincidir (ex: `.range()` inclusivo do Supabase, `.env.example` truthy quebrando `!process.env.X`). Documenta o erro **e** o padrão correto.
4. **Mudança em fluxo crítico** (cadastro de academia, entrada de aluno, execução de treino, webhook Stripe, instalação PWA).
5. **Convenção de UI ou cor** (paleta, regra de logo, inputs mobile, scroll horizontal).
6. **Status de feature/infra** (CI, lint, build, PWA, observability) — o que **já funciona** vs **TODO** vs **bloqueado**.
7. **Experimento descartado** quando vale registrar pra futuro não repetir cego (ver "Histórico" da paleta amber).

### Quando NÃO atualizar

- **Bugfix isolado** sem padrão novo (commit message basta).
- **Refactor interno** sem mudar superfície pública.
- **Coisa já óbvia** lendo o código (estrutura de pastas, nomes shadcn — sem valor).
- **Estado efêmero da sessão** (arquivos mexidos, progresso atual) — isso vive em checkpoint, não em CLAUDE.md.

### Estrutura de cada entrada

1. **Adicione na seção existente** se houver. Crie nova seção `##` só pra domínio realmente novo.
2. **Lead com regra/fato direto.** Em seguida: contexto/exemplo se ajudar, "porquê" se a regra for surpreendente.
3. **Tabelas** pra paleta, permissões, comparações, status de features.
4. **Bloco de código `✅ certo / ❌ errado`** pra padrões com armadilha (Supabase queries, paginação, casts de tipo).
5. **Linkar arquivos** via caminho relativo (ex: `apps/web/middleware.ts`) — facilita navegação.
6. **Datas em formato absoluto** (`out/2026`, `2026-06-05`) — relativos (`semana passada`) envelhecem mal.

### Estilo

- **Português pt-BR direto.** Sem "vamos garantir que…", "é importante notar que…". Verbo + substantivo concreto.
- **Sem promessa vazia.** Se algo está em roadmap, escreve "**TODO**" ou "**Pendente**" explícito. Se foi tentado e revertido, marca como "**Histórico:**" com o motivo.
- **Sem emoji decorativo.** Só ✅/❌/⚠️ funcionais em tabelas de status ou exemplos.
- **Sem repetir o que código já diz.** Padrão "componentes em PascalCase" sai do CLAUDE.md se já está em config — mas "logo sempre via `<BrandLogo>`" fica porque é decisão não-óbvia.

### Lifecycle e auditoria

- **Toda PR que muda comportamento documentado** precisa atualizar a seção correspondente. Doc velha mentindo é pior que doc ausente.
- **Marcar como `~~obsoleto~~`** seções de feature removida; remover de vez na próxima limpeza.
- **Revisão trimestral mínima** das seções "TODO", "Pendente" e "Histórico" — o que virou realidade desce pra fato, o que morreu sai.
- **Limite de tamanho:** se um `.md` passa de ~600 linhas, considere extrair seção pra arquivo dedicado (ex: `docs/security.md`) e deixar só o link no CLAUDE.md.

### Régua simples

Antes de escrever entrada nova, pergunte: **"Sem isso aqui, o próximo Claude (ou dev humano) novato no projeto cometeria erro previsível?"** Se sim, escreve. Se a resposta é "ele lê o código e descobre", não escreve.

---

## Comportamento Automático e Economia de Tokens
Você deve agir como um agente autônomo focado em máxima eficiência e economia de contexto. Adote as seguintes posturas automaticamente em todas as interações:

1. **Alterações de Código:** Sempre que for modificar arquivos existentes, aplique estritamente as regras da skill `.claude/skills/cirurgiao/SKILL.md`. Use apenas diffs cirúrgicos e nunca reescreva arquivos inteiros.
2. **Novos Componentes:** Sempre que o usuário pedir para criar um componente visual, siga o padrão definido em `.claude/skills/new-component/SKILL.md`.
3. **Novas Páginas/Rotas:** Sempre que o usuário pedir para criar uma nova tela ou rota no Next.js, siga o padrão de `.claude/skills/new-page/SKILL.md`.
4. **Criação de Testes:** Sempre que for criar testes, siga estritamente as regras da skill `.claude/skills/testador/SKILL.md` (foco em 3 cenários críticos e uso de mocks).
5. **Estilo de Resposta:** Vá direto ao ponto. Elimine saudações, cortesias e explicações teóricas longas, a menos que seja explicitamente perguntado o motivo.

## Atalhos e Rotinas de Prompt (Economia Extrema)
- **Quando o usuário digitar apenas "preparar checkpoint" ou "checkpoint":** Acione imediatamente a skill `.claude/skills/resumidor/SKILL.md`. Gere o bloco markdown ultra-compactado com o estado atual e instrua o usuário a usar `/clear` e colar o bloco a seguir.

## Comandos Úteis do Projeto

Rodar da **raiz do monorepo** (`GymFlow-main/`), não de `apps/web/`:

- `pnpm install` — instalar dependências do workspace. **Rodar sempre depois de `pnpm add` em qualquer pacote** — `pnpm add --filter X dep` deixa o lockfile global stale e o próximo `dev` pode quebrar com "Module not found" mesmo com o pacote fisicamente em `node_modules/`.
- `doppler run -- pnpm --filter @gymflow/web dev` — dev server com envs reais (recomendado)
- `pnpm dev` — dev server sem Doppler (precisa de `.env.local` manual em `apps/web/`)
- **`pnpm --filter @gymflow/web dev:webpack`** — dev sem Turbopack. **Use sempre que estiver mexendo com Sentry, next-pwa ou outros plugins webpack-style.** Turbopack quebra com a combinação Sentry + next-pwa: o erro típico é `TurbopackInternalError: Next.js package not found` ou `Module not found: Can't resolve '@sentry/nextjs'` no `instrumentation.ts`. O próprio Sentry recomenda no warning de boot: "we recommend temporarily removing the `--turbo` flag while you are developing locally".
- **`supabase start`** (precisa Docker Desktop **rodando**, não só instalado) — sobe Postgres local em containers e Supabase Studio em `localhost:54323`. Queries ficam ~10x mais rápidas que prod (~5-20ms vs ~150-300ms WAN). Não usado hoje por inércia, mas é o maior ganho disponível pra dev se você ligar o Docker.

**Status Turbopack (out/2026):** não viável com a stack atual. Sentry SDK não suporta + next-pwa injeta plugin webpack que turbopack ignora. Esperar maturação ao longo de 2026 ou remover uma das duas deps pra reativar.

**Sentry DSN — pegadinha de placeholder:** `sentry.{client,server,edge}.config.ts` validam o DSN com regex antes de chamar `Sentry.init`. Sem isso, o placeholder `https://...@sentry.io/...` do `.env.example` faz o init explodir com `Invalid Sentry Dsn` e derruba a página inteira (tela preta em dev). Padrão: `^https:\/\/[a-f0-9]+@[^/]+\/\d+$`. **Quando adicionar nova call de `Sentry.init`, replicar a guard.** Mesma família do problema documentado em `lib/rate-limit.ts → hasValidUpstashEnv()`.
- `pnpm build` — build de tudo via Turbo (passa pelo `doppler run` em `apps/web`)
- `pnpm type-check` — checks de tipo via tsc em todos os pacotes (rodado no CI)
- `pnpm lint` — **não configurado** ainda (`next lint` cai em prompt interativo)
- `pnpm db:push` / `pnpm db:reset` / `pnpm db:types` — migrations e tipos
- Smoke test: `PORT=3333 bash .claude/skills/run-gymflow/smoke.sh`
- Rotinas integradas: skill `.claude/skills/run-gymflow/SKILL.md`

---

## Verificação de e-mail (OTP via Resend) — jun/2026

Política app-side de confirmação de e-mail. **Não usa a confirmação nativa do Supabase** (`enable_confirmations` continua `false`): ligá-la removeria a sessão imediata pós-signup e quebraria o onboarding/criação de academia + tratamento de órfão. Aqui a verificação é um gate da aplicação.

**Mecanismo (OTP 6 dígitos):**
- Migration `071_email_verification.sql`: coluna `profiles.email_verified_at timestamptz` (gate) + tabela `email_verifications` (guarda só o **hash sha256** do código, nunca o código cru; RLS ligada **sem policy** = só service_role acessa). Backfill: todos os profiles existentes viraram verificados (grandfather) — só contas novas começam com `email_verified_at = null`.
- Lógica compartilhada em `apps/web/lib/email-verification.ts` (admin client service_role, `generateCode`, `hashCode`, TTL 15min, máx 6 tentativas, cooldown reenvio 30s).
- `POST /api/auth/send-verification` (sessão obrigatória): gera código, invalida anteriores não consumidos, envia via `lib/resend.ts` + template `lib/email-templates/email-verification.ts`. Idempotente se já verificado. Cooldown de 30s.
- `POST /api/auth/verify-email` (sessão + Zod `^\d{6}$`): valida hash/expiração/tentativas, marca `consumed_at` + `profiles.email_verified_at = now()`.
- Página `apps/web/app/(auth)/verificar-email/page.tsx`: input OTP + reenviar com contagem. Auto-envia 1 código no mount. As 2 rotas **não** estão na allowlist do middleware (exigem sessão — o user já está logado pós-signup).

**Gate (3 camadas):**
1. `signUp` (`hooks/use-auth.ts`) roteia pra `/verificar-email?next=<dest>` em vez de direto ao onboarding.
2. `/onboarding` redireciona pra `/verificar-email` se `email_verified_at` é null (UX/defesa).
3. `POST /api/academy` retorna **403 `EMAIL_NOT_VERIFIED`** se não verificado (gate autoritativo server-side — criação de academia é o ponto sensível).

**Pendente:** FROM ainda é sandbox `onboarding@resend.dev` (mesma limitação do email de inatividade — só entrega pro dono da conta Resend até validar domínio). Trocar quando o domínio for verificado.

## Notificações via Resend

**Email semanal de inatividade pro owner:** ✅ implementado (jun/2026).
- Rota: `apps/web/app/api/cron/notifications/inactivity/route.ts` (GET, autorizada via `Bearer $CRON_SECRET`).
- Cron Vercel: segunda 12h UTC (`vercel.json` → `crons[]`).
- Helper Resend em `apps/web/lib/resend.ts`. Template HTML inline em `apps/web/lib/email-templates/weekly-inactivity.ts`.
- FROM atual: sandbox `onboarding@resend.dev` (sem domínio validado). Trocar quando o domínio for verificado no Resend.
- Idempotência: tabela `sent_notifications (user_id, kind, target_date)` com UNIQUE — segundo hit na mesma semana retorna `skipped`. Migration 067.
- Opt-in: tabela `notification_preferences.email_weekly_report` (default `true`). Sincronizada do toggle em `/configuracoes` → aba Notificações. localStorage continua como cache local.
- **Pegadinha:** Vercel Cron só roda em prod. Pra testar local, hit manual `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/notifications/inactivity`.

**Ainda pendente (não bloqueia o caso de uso acima):**
1. **Eventos transacionais** (novo aluno, treino concluído) — disparados inline na própria API route que cria o recurso. Por ora não enviados.
2. **Templates extras** — boas-vindas owner, novo aluno chegou. Mesmo padrão de `weekly-inactivity.ts`.
3. **Outros toggles** em `gymflow_notifications` (push, novo aluno, treino concluído) ainda só em localStorage — não enviam nada.
4. **Limite de envio** — Resend free tier 100/dia. Assinar plano pago ANTES de escalar. Sentry alert quando 80% da quota.
5. **Re-adicionar à landing:** depois que rodar 1 mês em prod sem bug, voltar "Notificações de inatividade" na lista do plano Pro em `app/page.tsx`.

## PWA install — prompt agressivo após 1º treino

Implementado jun/2026: quando aluno conclui o **primeiro** treino, o `WorkoutComplete` (em `app/(dashboard)/treinos/executar/[id]/page.tsx`) mostra bottom sheet "Instale como app" depois de ~600ms. Anti-spam via `localStorage.meutrein_pwa_install_prompted` — só prompta 1x por device. Detecção do 1º treino: `select count from workout_logs where student_id = me` retorna 1 (o log atual já foi inserido).

Lógica de install extraída em hook reutilizável: `apps/web/hooks/use-install-prompt.ts`. `<InstallButton />` (que aparece em outras telas) consome o mesmo hook.

**Bloqueio Android resolvido (jun/2026):** os 4 PNGs existem em `public/icons/` e o apple-touch-icon vem de `app/apple-icon.tsx`. Falta só validar com Lighthouse PWA audit em produção.

---

## CI

GitHub Actions roda em `.github/workflows/ci.yml` a cada PR pra `main` e push em `main`.

**Hoje:**
- ✅ `type-check` — `tsc --noEmit` em todos os pacotes via Turbo. Bloqueia merge se quebrar.

**TODO (estão comentados no YAML, prontos pra ativar):**
- ⏳ `lint` — depende de configurar `eslint.config.mjs` em `apps/web` + popular `packages/config/eslint/` (hoje vazio). `next lint` em projeto sem config cai em prompt interativo e quebra.
- ⏳ `build` — depende de remover dependência de Doppler no `next build` ou injetar `DOPPLER_TOKEN` como secret. Hoje o script é `doppler run -- next build` e falha sem token.

**Particularidades resolvidas:**
- `packages/database` precisa de `tsconfig.json` (estende `@gymflow/typescript-config/base.json`) — sem ele `tsc --noEmit` cai no help.
- `packages/ui` está vazio (sem `src/`); type-check é `echo skip` até o pacote ter conteúdo.

**Branch protection sugerida:** Settings → Branches → require `CI / Type-check` passing pra mergear em `main`.
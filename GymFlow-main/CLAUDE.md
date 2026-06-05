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
- **Storage keys** (mudar **desloga todo mundo / apaga rascunhos** em prod):
  - `gymflow-auth` em `stores/auth-store.ts` (Zustand persist — sessão).
  - `gymflow_notifications` em `app/(dashboard)/configuracoes/page.tsx` (preferências de notificação).
  - `gymflow_draft_${userId}_${sheetId}[_d${day}]` em `app/(dashboard)/treinos/executar/[id]/page.tsx` (rascunho de treino em andamento).
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
      /stripe.ts, /cnpj.ts, /places.ts
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
3. **Rate limiting** (`apps/web/lib/rate-limit.ts`) — Upstash Redis quando disponível, fallback in-memory caso contrário (validado por `hasValidUpstashEnv()`, não só presença). Limiters nomeados: `auth` (5/15min), `invite` (10/5min). Use sempre `limiter.limit(ip)` em rotas de autenticação/convite.
4. **Cloudflare Turnstile** (`apps/web/lib/turnstile.ts`) — obrigatório em rotas públicas de auth e lookup. Validação server-side via `verifyTurnstileToken()`. Em `NODE_ENV !== 'production'` com secret ausente, gate permissivo (só pra dev local sem Doppler).

Toda rota nova de auth/lookup pública precisa passar pelas 4 camadas. Mensagens de erro normalizadas pra evitar enumeração (ex: "Credenciais inválidas" cobre user-not-found E senha errada).

---

## Multi-tenant — regras críticas

1. **Todo insert precisa de `academy_id`** — sem exceção
2. **Todo select já é filtrado pelo RLS** — mas sempre incluir `.eq('academy_id', academyId)` explicitamente para clareza
3. **Ao criar uma academia**, inserir o usuário em `academy_members` com `role: 'owner'` na mesma transação
4. **Convites expiram** — sempre checar `expires_at` e `used` antes de processar

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

- **Componentes base:** sempre usar shadcn/ui (`Button`, `Input`, `Card`, `Badge`, `Dialog`)
- **Ícones:** Lucide React, outline, 20-24px
- **Cor primária:** teal `#1D9E75` — usar `text-teal-600`, `bg-teal-50`, `border-teal-200`
- **Cor de destaque:** amber `#EF9F27` — usar para recordes pessoais e conquistas
- **Mobile-first:** toda tela deve funcionar em 375px
- **Estado vazio:** sempre ter ícone + mensagem + botão de ação
- **Loading:** usar skeleton (shadcn/ui `Skeleton`), nunca spinner sozinho em tela cheia
- **Inputs numéricos no mobile:** sempre passar `inputMode` junto com `type="number"`. Use `"decimal"` para pesos/medidas/percentuais e `"numeric"` para inteiros (reps, idade). Sem isso, o aluno suado registrando carga pega teclado QWERTY.
- **Scroll horizontal mobile:** quando usar `overflow-x-auto` em tabs/filtros, esconder a scrollbar nativa (`[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`) e adicionar gradient fade na borda direita pra indicar conteúdo cortado (ver `app/(dashboard)/configuracoes/page.tsx`).

---

## Fluxos críticos — não quebrar

### Cadastro de academia
```
CNPJ → ReceitaWS → preenche dados → Google Places → confirma → cria academia + membro owner
```

### Entrada do aluno
```
Link /convite/[code] → valida código (não expirado, não usado) → cria user → cria academy_member → marca convite como usado
```

### Execução de treino
```
Cria workout_log → para cada série confirmada, cria set_log → ao finalizar, seta finished_at no workout_log
```

Esses três fluxos são o coração do produto. Qualquer mudança neles precisa de atenção redobrada.

---

## RPCs críticas (SECURITY INVOKER)

Operações que precisam de atomicidade vivem em RPCs Postgres, não em código de aplicação:

- **`complete_workout(client_id, exercises, ...)`** — `028_complete_workout_rpc.sql`. Salva treino + set_logs em transação única. Idempotência via `client_id` (UUID gerado no draft do cliente) + unique partial index em `workout_logs.client_id`. Substitui o INSERT múltiplo do client que era propenso a estado parcial.
- **`list_academy_students(p_academy_id, p_search, p_status, p_limit, p_offset)`** — `029_list_academy_students_rpc.sql`. Consolida `academy_members + profiles + workout_logs(agg) + workout_sheets(agg)` numa query só, com search via `extensions.unaccent + ILIKE`, paginação e `total_count`. Permission check owner/personal embutido. Substitui o N+1 + mentira-de-UI antigo.
- **`accept_invite(p_token, p_user_id)`** — `030_accept_invite_rpc.sql`. `FOR UPDATE` lock + check de `uses_limit` pré-incremento + idempotência por `(academy, user)`. Erros nomeados: `INVITE_UNAVAILABLE`, `EXPIRED`, `EXHAUSTED`, `INVALID_ROLE`. **GRANT só para `service_role`** — chamada exclusivamente do API route, nunca do client.

Webhook Stripe (`apps/web/app/api/webhooks/stripe/route.ts`) usa claim atômico via `upsert ON CONFLICT DO NOTHING RETURNING` em `processed_events` + rollback do registro no `catch` (Stripe retenta evento se o handler subir).

---

## O que não fazer

- **Não criar componentes de UI do zero** se existe no shadcn/ui
- **Não usar `localStorage`** para dados do usuário — usar Supabase Auth session
- **Não fazer queries sem tratamento de erro**
- **Não expor chaves de API no cliente**
- **Não fazer redirect no middleware sem checar o role** — aluno não pode acessar `/dashboard`
- **Não remover `academy_id` de nenhuma tabela** — quebra o isolamento multi-tenant
- **Não usar `useEffect` para buscar dados** — usar React Query ou server components

---


## Migrations

Toda mudança no banco vira um arquivo novo em `supabase/migrations/`. Numeração sequencial (`001…039`) + arquivos `<timestamp>_remote_schema.sql` quando se faz `supabase db pull`.

Atalhos no `package.json` da raiz:
- `pnpm db:push` — aplica migrations locais no projeto linked (CUIDADO: hoje aponta pra prod)
- `pnpm db:reset` — reseta DB local
- `pnpm db:types` — regenera `packages/database/src/types.ts` (rodar após toda migration que cria/altera tabela ou RPC)

**Regras:**
- Nunca editar uma migration já aplicada em produção — sempre criar uma nova
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

- `pnpm install` — instalar dependências do workspace
- `doppler run -- pnpm --filter @gymflow/web dev` — dev server com envs reais (recomendado)
- `pnpm dev` — dev server sem Doppler (precisa de `.env.local` manual em `apps/web/`)
- `pnpm build` — build de tudo via Turbo
- `pnpm type-check` / `pnpm lint` — checks
- `pnpm db:push` / `pnpm db:reset` / `pnpm db:types` — migrations e tipos
- Smoke test: `PORT=3333 bash .claude/skills/run-gymflow/smoke.sh`
- Rotinas integradas: skill `.claude/skills/run-gymflow/SKILL.md`
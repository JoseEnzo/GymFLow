# Diretrizes do Projeto GymFlow

# GymFlow — CLAUDE.md

Guia de contexto e boas práticas para o Claude Code trabalhar neste projeto.

---

## O que é o GymFlow

Plataforma SaaS multi-tenant para academias. Academias se cadastram, personais montam fichas de treino e alunos registram progresso pelo celular.

**Três roles:** `owner` | `personal` | `student`
**Modelo:** cada academia é um tenant isolado via RLS no Supabase.

---

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Backend:** Supabase (Auth + PostgreSQL + Storage + Realtime)
- **Segurança:** Row Level Security (RLS) em todas as tabelas
- **Pagamentos:** Stripe
- **E-mail:** Resend
- **Deploy:** Vercel

---

## Estrutura de pastas

```
/app
  /auth/login
  /auth/cadastro
  /auth/convite          → entrada via link de convite
  /dashboard             → owner
  /alunos                → owner e personal
  /treinos               → personal cria, aluno executa
  /exercicios            → biblioteca
  /historico             → aluno
  /evolucao              → aluno (gráficos)
  /perfil
/components
  /ui                    → shadcn/ui base
  /layout                → sidebar, bottom nav, header
  /workout               → componentes de treino
/lib
  /supabase.ts
  /stripe.ts
  /cnpj.ts               → integração ReceitaWS
  /places.ts             → integração Google Places
/types
  /index.ts              → todos os tipos TypeScript
/hooks
/supabase
  /migrations
    /001_initial.sql     → schema completo + seed
```

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

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # apenas server-side

# Google Places
GOOGLE_PLACES_API_KEY=             # apenas server-side

# Stripe
STRIPE_SECRET_KEY=                 # apenas server-side
STRIPE_WEBHOOK_SECRET=             # apenas server-side
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=                    # apenas server-side
```

Variáveis sem `NEXT_PUBLIC_` nunca chegam ao cliente. Se precisar de uma no frontend, expor via API route.

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

Toda mudança no banco vira um arquivo novo em `/supabase/migrations/`:

```
001_initial.sql          → schema base + seed de exercícios
002_add_notifications.sql → exemplo de migration futura
```

Nunca editar uma migration já aplicada em produção — sempre criar uma nova.

---

## Contexto de negócio

- **Cliente pagante é a academia** — aluno nunca paga diretamente
- **Churn acontece quando o aluno não engaja** — UX do aluno é a mais crítica
- **Personal trainer é o usuário mais ativo** — a ferramenta de criação de fichas precisa ser rápida
- **Academias pequenas são o target** — sem features enterprise desnecessárias no MVP
- **Mobile-first porque o aluno usa na academia** — durante o treino, com as mãos suadas

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
- Instalar dependências: `pnpm install`
- Rodar o ambiente de desenvolvimento: `pnpm dev`
- Executar build: `pnpm build`
- Executar rotinas integradas: Use a skill `.claude/skills/run-gymflow/SKILL.md`
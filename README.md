# GymFlow

Plataforma SaaS multi-tenant para academias. Academias se cadastram, personais montam fichas de treino e alunos registram progresso pelo celular.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Estado | Zustand |
| Backend / Banco | Supabase (Auth + PostgreSQL + Storage + Realtime) |
| Segurança | Row Level Security (RLS) em todas as tabelas |
| Pagamentos | Stripe |
| E-mail | Resend |
| CAPTCHA | Cloudflare Turnstile |
| Rate Limiting | Upstash Redis |
| Deploy | Vercel |
| Monorepo | Turborepo + pnpm workspaces |

---

## Funcionalidades

### Autenticacao
- Cadastro com e-mail e senha
- Login com CAPTCHA (Cloudflare Turnstile)
- Recuperacao e redefinicao de senha
- Deteccao automatica de role no login
- Onboarding guiado apos primeiro acesso

### Academia (owner)
- Cadastro com preenchimento automatico via CNPJ (ReceitaWS)
- Enriquecimento de dados via Google Places (fotos, horarios, endereco)
- Geracao de link e codigo de convite para alunos e personais
- Cadastro e gestao de personais
- Dashboard com total de alunos, frequencia semanal e alunos inativos
- Configuracoes da academia
- Historico de pagamentos e portal de faturamento (Stripe)

### Personal
- Lista de alunos vinculados
- Criar ficha de treino (nome + objetivo)
- Adicionar exercicios da biblioteca global
- Configurar series, repeticoes, descanso e observacoes por exercicio
- Ver historico de treinos do aluno
- Agenda de atendimentos
- Avaliacao de bioimpedancia e medidas corporais dos alunos

### Aluno
- Cadastro via link ou codigo de convite
- Ver ficha de treino atual
- Executar treino com registro de carga por serie
- Timer de descanso entre series
- Historico de treinos realizados
- Grafico de evolucao de carga por exercicio
- Aba de evolucao de medidas corporais
- Upload de foto de perfil

### Biblioteca de exercicios
- 90+ exercicios globais pre-cadastrados
- Filtro por grupo muscular
- Personal pode adicionar exercicios personalizados da academia

---

## Estrutura do projeto

```
GymFlow/
├── apps/
│   └── web/                        # App Next.js
│       ├── app/
│       │   ├── (auth)/             # Login, cadastro, convite, onboarding
│       │   ├── (dashboard)/        # Todas as telas autenticadas
│       │   │   ├── agenda/
│       │   │   ├── alunos/
│       │   │   ├── configuracoes/
│       │   │   ├── dashboard/
│       │   │   ├── evolucao/
│       │   │   ├── exercicios/
│       │   │   ├── frequencia/
│       │   │   ├── historico/
│       │   │   ├── perfil/
│       │   │   ├── personais/
│       │   │   └── treinos/
│       │   └── api/                # Routes server-side (billing, cnpj, places, webhooks)
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── stores/
│       └── types/
├── packages/                       # Packages compartilhados
└── supabase/
    └── migrations/                 # Historico completo do schema
```

---

## Roles e permissoes

| Acao | owner | personal | student |
|---|---|---|---|
| Ver alunos da academia | Todos | Somente os seus | - |
| Criar ficha de treino | + | + | - |
| Executar treino | - | - | + |
| Gerar convites | + | + (so para alunos) | - |
| Ver dados da academia | + | - | - |
| Gerenciar personais | + | - | - |
| Avaliar bioimpedancia | + | + | - |
| Ver evolucao propria | - | - | + |

---

## Setup

### Prerequisitos

- Node.js >= 20
- pnpm >= 9
- Conta no [Supabase](https://supabase.com)

### 1. Clonar e instalar

```bash
git clone https://github.com/JoseEnzo/GymFLow.git
cd GymFLow
pnpm install
```

### 2. Variaveis de ambiente

```bash
cp GymFlow/.env.example GymFlow/apps/web/.env.local
```

Preencha o arquivo `GymFlow/apps/web/.env.local`:

| Variavel | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks |
| `RESEND_API_KEY` | Resend → API Keys |
| `GOOGLE_PLACES_API_KEY` | Google Cloud Console → APIs |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile → Add Site |
| `TURNSTILE_SECRET_KEY` | Cloudflare → Turnstile |
| `UPSTASH_REDIS_REST_URL` | Upstash → Redis → Create Database |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash → Redis |

> Para testar sem criar contas no Turnstile e Upstash, use as chaves de teste:
> ```
> NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
> TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
> ```
> O rate limiting cai automaticamente para fallback in-memory sem Upstash.

### 3. Aplicar migrations

No painel SQL do Supabase, execute os arquivos em `supabase/migrations/` em ordem numerica.

### 4. Rodar

```bash
cd GymFlow
pnpm dev
```

Acesse: http://localhost:3000

---

## Comandos

```bash
pnpm dev          # desenvolvimento
pnpm build        # build de producao
pnpm lint         # checar erros de lint
pnpm type-check   # checar tipos TypeScript
pnpm test         # rodar testes
pnpm db:reset     # resetar banco (Supabase local)
pnpm db:types     # gerar tipos TypeScript do banco
```

---

## Setup em Windows sem permissao de administrador

Consulte o [SETUP.md](SETUP.md) para instrucoes detalhadas em ambientes com restricoes (laboratorios, escolas).

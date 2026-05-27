# GymFlow — Setup em PC Novo

## 1. Instalar ferramentas

### Node.js (via nvm — recomendado)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Feche e reabra o terminal, depois:
nvm install 20
nvm use 20
```

### pnpm
```bash
npm install -g pnpm
```

### Git
```bash
# Linux
sudo apt install git

# Windows: baixe em https://git-scm.com
```

---

## 2. Clonar o repositório
```bash
git clone https://github.com/JoseEnzo/GymFLow.git
cd GymFLow
```

---

## 3. Instalar dependências
```bash
pnpm install
```

---

## 4. Configurar variáveis de ambiente
```bash
cp GymFlow/.env.example GymFlow/apps/web/.env.local
```

Abra o arquivo `GymFlow/apps/web/.env.local` e preencha as chaves:

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Painel Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Painel Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Painel Supabase → Project Settings → API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Painel Stripe → Developers → API Keys |
| `STRIPE_SECRET_KEY` | Painel Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Painel Stripe → Developers → Webhooks |
| `RESEND_API_KEY` | Painel Resend → API Keys |
| `GOOGLE_PLACES_API_KEY` | Google Cloud Console → APIs |

---

## 5. Rodar o projeto
```bash
cd GymFlow/apps/web
pnpm dev
```

Acesse em: http://localhost:3000

---

## O que NÃO fica no GitHub

| Item | Motivo |
|---|---|
| `node_modules/` | Gerado pelo `pnpm install` |
| `.env.local` | Contém chaves de API secretas |
| `.next/` | Build gerado automaticamente |

---

## Comandos úteis do projeto

```bash
pnpm install      # instalar dependências
pnpm dev          # rodar em desenvolvimento
pnpm build        # gerar build de produção
pnpm lint         # checar erros de lint
```

---

## Subir alterações para o GitHub

```bash
# 1. Ver o que mudou
git status

# 2. Adicionar os arquivos alterados
git add .                     # todos os arquivos
# ou
git add nome-do-arquivo.tsx   # arquivo específico

# 3. Criar o commit com mensagem
git commit -m "descrição do que você fez"

# 4. Enviar pro GitHub
git push origin main
```

**Fluxo completo de exemplo:**
```bash
git status
git add .
git commit -m "feat: adicionar tela de treinos"
git push origin main
```

> Sempre faça `git pull origin main` antes de começar a trabalhar, para evitar conflitos.


Fazer na aula de LIP

✅ 1. Nenhum pacote novo
Todos já estão no package.json: zod, @upstash/ratelimit, @upstash/redis, framer-motion, etc.


# Só rodar se nunca instalou antes
pnpm install
🗄️ 2. Migrations — rodar no Supabase SQL Editor
Cole e execute em ordem:

Arquivo	O que faz
006_personal_invite_role_constraint.sql	Personal só pode convidar alunos
007_bioimpedance_assessments.sql	Tabela de bioimpedância + RLS
008_body_measurements.sql	Tabela de medidas corporais + RLS
009_more_exercises.sql	+60 exercícios no banco
010_avatars_storage.sql	Bucket avatars + políticas RLS
Se usar Supabase local: pnpm supabase db reset (roda tudo automaticamente)

🔑 3. Variáveis de ambiente — adicionar no .env.local

# ── Upstash Redis (rate limiting em produção) ──────────────────
# Criar em: https://console.upstash.com → Redis → Create Database
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# ── Cloudflare Turnstile (CAPTCHA no login) ────────────────────
# Criar em: https://dash.cloudflare.com → Turnstile → Add Site
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
⚠️ Para testar agora sem criar conta:


# Chaves de teste oficiais da Cloudflare (sempre passam)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
O rate limiting já funciona sem Upstash (fallback in-memory automático).

▶️ 4. Rodar o app

cd GymFlow
pnpm dev
Acessar: http://localhost:3000

🧪 5. Testar as novidades
Rota	O que verificar
/login	Turnstile invisível ativo (inspecionar Network → /api/turnstile)
/perfil	Upload de foto (vai para /api/upload/avatar)
/alunos/[id]	Seções Bioimpedância + Medidas
/evolucao	Tab Treinos / Medidas
/perfil	Editar dados, IMC ao vivo
📦 6. Commit (quando tudo estiver ok)

git add .
git commit -m "feat: security hardening, perfil page, bioimpedance, measurements, evolution dashboard"
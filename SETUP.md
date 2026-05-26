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

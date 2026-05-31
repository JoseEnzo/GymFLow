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
# 1. Iniciar seu repositorio git
git init
# 2. Logar ao seu repositorio git
git remote add origin https://github.com/JoseEnzo/GymFLow.git
# 3. Ver o que mudou
git status

# 4. Adicionar os arquivos alterados
git add .                     # todos os arquivos

# 5. Criar o commit com mensagem
git commit -m "Adicionei mais exercicios 236 - 640, corrigi erros de CNPJ com CPF, agora os perfis mostram seus emails"

# 6. Enviar pro GitHub
git push origin main
```
```

> Sempre faça `git pull origin main` antes de começar a trabalhar, para evitar conflitos.

---

# 🪟 Setup Windows — Sem Permissão de Administrador

> Guia para configurar o ambiente em computadores Windows **sem permissão de administrador** (laboratórios, escolas, etc).

---

## ⚠️ Restrições conhecidas

| Restrição | Impacto |
|-----------|---------|
| Sem permissão de admin | Não pode usar instaladores `.exe` |
| `bash` não disponível | Não pode usar scripts `.sh` |
| Execução de scripts bloqueada por GPO | Perfil do PowerShell não carrega automaticamente |
| `nvm-windows` requer admin | Usar `fnm` no lugar |

---

## 1. Instalar o fnm (gerenciador de versões do Node)

Abra o **PowerShell** e rode os comandos abaixo:

```powershell
# Criar pasta do fnm no perfil do usuário
New-Item -ItemType Directory -Force "$env:USERPROFILE\.fnm" | Out-Null

# Baixar o fnm (sem admin, sem instalador)
Invoke-WebRequest -Uri "https://github.com/Schniz/fnm/releases/latest/download/fnm-windows.zip" -OutFile "$env:TEMP\fnm.zip" -UseBasicParsing

# Extrair na pasta do usuário
Expand-Archive "$env:TEMP\fnm.zip" -DestinationPath "$env:USERPROFILE\.fnm" -Force

# Adicionar ao PATH do usuário (sem admin)
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*\.fnm*") {
    [Environment]::SetEnvironmentVariable("PATH", "$userPath;$env:USERPROFILE\.fnm", "User")
}

Write-Host "fnm instalado em: $env:USERPROFILE\.fnm"
```

---

## 2. Liberar execução de scripts (sem admin)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

> ℹ️ Se aparecer aviso de "substituído por política de escopo mais específico", pode ignorar — a política efetiva ainda permite rodar scripts.

---

## 3. Instalar o Node.js

```powershell
# Ativar o fnm na sessão atual
$env:PATH += ";$env:USERPROFILE\.fnm"
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression

# Instalar Node LTS
fnm install --lts

# Ativar a versão instalada (usar número, não alias "lts")
fnm use 24
```

Verificar instalação:

```powershell
node --version   # deve mostrar v24.x.x
npm --version    # deve mostrar 10.x.x ou superior
```

---

## 4. Instalar o pnpm

```powershell
npm install -g pnpm
```

Verificar:

```powershell
pnpm --version   # deve mostrar 9.x.x ou superior
```

---

## 5. Clonar e configurar o projeto

```powershell
# Navegar até onde quer salvar o projeto
cd "$env:USERPROFILE\Documents\GitHub"

# Clonar o repositório
git clone https://github.com/JoseEnzo/GymFLow.git

# Entrar na pasta do projeto
cd GymFLow

# Instalar dependências
pnpm install
```

---

## 6. Rodar o projeto

```powershell
pnpm dev
```

---

## 🔁 Toda vez que abrir um novo terminal

> Como o perfil automático do PowerShell pode estar bloqueado por política da máquina, rode estes 3 comandos **no início de cada sessão** antes de usar Node/pnpm:

```powershell
$env:PATH += ";$env:USERPROFILE\.fnm"
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
fnm use 24
```

Depois navegue até o projeto e rode normalmente:

```powershell
cd "$env:USERPROFILE\Documents\GitHub\GymFlow"
pnpm dev
```

---

## 💡 Dica: criar um atalho rápido

Para não precisar digitar os 3 comandos toda vez, salve um arquivo `iniciar.ps1` na raiz do projeto com este conteúdo:

```powershell
$env:PATH += ";$env:USERPROFILE\.fnm"
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
fnm use 24
pnpm dev
```

E rode assim:

```powershell
powershell -ExecutionPolicy Bypass -File .\iniciar.ps1
```

---

## ❓ Problemas comuns

### `bash não é reconhecido`
O computador não tem WSL nem Git Bash. Use apenas comandos PowerShell.

### `pnpm não é reconhecido`
O fnm não foi ativado na sessão. Rode os 3 comandos da seção **"Toda vez que abrir um novo terminal"**.

### `ERR_PNPM_NO_PKG_MANIFEST`
Você está na pasta errada. Navegue até a pasta do projeto antes de rodar `pnpm install`.

### `fnm use lts` não funciona
Use o número da versão: `fnm use 24`.

### Perfil `.ps1` bloqueado ao abrir o terminal
Política de segurança da máquina bloqueia o perfil automático. Use o `iniciar.ps1` com `-ExecutionPolicy Bypass` conforme a dica acima.

---

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

# Setup do Ambiente de Desenvolvimento

## Pré-requisitos

- Node.js 18+
- pnpm
- Doppler CLI

## 1. Instalar dependências

```bash
pnpm install
```

## 2. Configurar variáveis de ambiente com Doppler

### Instalar o Doppler CLI (Linux)

```bash
(curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh || wget -t 3 -qO- https://cli.doppler.com/install.sh) | sudo sh
```

### Fazer login

```bash
doppler login
```

### Conectar o projeto

```bash
cd apps/web
doppler setup
# Projeto: gymflow-s-org
# Ambiente: dev
```

## 3. Rodar o projeto

```bash
doppler run -- pnpm dev
```

---

> As variáveis de ambiente ficam armazenadas no Doppler (projeto `gymflow-s-org`, ambiente `dev`).
> Nunca commite arquivos `.env.local` com valores reais.

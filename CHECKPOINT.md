# Checkpoint

## 2026-06-14 15:40 — Fixes de FPS APLICADOS na landing ✅ (type-check OK)

**Tarefa / objetivo:** corrigir o baixo FPS da landing (usuário aprovou com "ok").

**Feito (3 diffs cirúrgicos em `app/page.tsx`):**
1. **Removido `bg-fixed`** da raiz do `LandingPage` (`bg-mesh bg-fixed` → `bg-mesh`). Maior ganho: acaba o repaint do fundo de 8 camadas a cada frame de scroll. Visual ~idêntico (fundo rola junto).
2. **FloatingCards: `glass` → `bg-card/90`** (mantendo `border-brand-500/10`). Esses cards usam `animate-float` (animam sempre) — `backdrop-blur` re-borrava a cada frame. Comentário explicativo deixado no código.
3. **Nav (scrolled): `backdrop-blur-xl` → `backdrop-blur-md`** + `bg-background/80` → `/90`. Nav fica fixo durante todo o scroll; raio de blur menor = menos custo de re-blur.

`pnpm --filter @gymflow/web type-check` OK.

**NÃO mexido (culpados menores, atacar só se ainda travar):** glow `box-shadow` animado das partículas (`page.tsx:146`); `Counter` com `setInterval` 16ms (`page.tsx:54-66`); mobile menu `backdrop-blur-xl` (abre só brevemente).

**Próximos passos:**
- [ ] Usuário rolar http://localhost:3334/ e confirmar se destravou; se ainda travar, dizer ONDE (hero / scroll / seção) pra afinar o resto.
- [ ] (pendência) Login Google: usuário ainda não disse apex vs www.
- [ ] (pendência) Commitar tudo: `page.tsx` acumula BeforeAfterSection+TrustStrip + estes 3 fixes de FPS — nada commitado ainda.

**Arquivos tocados:** `GymFlow-main/apps/web/app/page.tsx` — `bg-fixed` removido (raiz), `FloatingCard` sem `glass`, `Nav` blur reduzido.

**Como retomar:** fixes de FPS no working tree, não commitados. Se ainda houver travada, próximos alvos são partículas (reduzir/remover box-shadow animado) e `Counter` (trocar setInterval por requestAnimationFrame ou reduzir frequência).

## 2026-06-14 15:25 — Diagnóstico de baixo FPS na landing (aguardando OK pra corrigir)

**Tarefa / objetivo:** usuário relatou "baixo FPS" em partes da landing. Identificar a causa.

**Diagnóstico (confirmado lendo `page.tsx` + `globals.css`), em ordem de impacto:**
1. **`bg-fixed` sobre `bg-mesh` pesado — MAIOR culpado.** `page.tsx:1731` (`bg-mesh bg-fixed`). `background-attachment: fixed` repinta o fundo inteiro a cada frame de scroll, e o `bg-mesh` tem 8 camadas (ruído SVG repetido + 7 radial-gradients, `globals.css:314-335`). Trava de scroll clássica.
2. **`backdrop-blur` (classe `.glass` = `backdrop-blur-md`, `globals.css:142`) em todo lugar.** Re-borra a cada frame. Agravantes: Nav fixo `backdrop-blur-xl` sempre visível; FloatingCards do Hero são `glass` E animam (`animate-float`) ao mesmo tempo.
3. **Glows `box-shadow` animados nas partículas** (`page.tsx:146`) — menor.
4. **`Counter` com `setInterval` 16ms** (`page.tsx:54-66`) — ~110 re-renders ×4 contadores; trava curta na entrada da StatsBar.

**Recomendação dada:** começar removendo `bg-fixed` (ganho grande, perda visual ~nula — fundo passa a rolar junto). Depois, opcional, afinar `backdrop-blur` nos elementos animados (muda um pouco a estética).

**Próximos passos:**
- [ ] **AGUARDANDO OK do usuário** pra: (a) remover `bg-fixed` em `page.tsx:1731`; (b) opcionalmente reduzir blur dos elementos animados (FloatingCards/Nav).
- [ ] (pendência anterior) Login Google: usuário ainda não disse se site abre em apex vs www.

**Arquivos tocados nesta rodada:** nenhum (só diagnóstico). `page.tsx` segue com BeforeAfterSection+TrustStrip não-commitados.

**Como retomar:** nada editado. Se aprovado, o fix #1 é trocar `bg-mesh bg-fixed` por `bg-mesh` (remover `bg-fixed`) na raiz do `LandingPage`. Os outros fixes têm tradeoff visual — confirmar antes.

## 2026-06-14 15:00 — Diagnóstico: login Google cai em vercel.app (config externa, NÃO bug de código)

**Tarefa / objetivo:** login com Google redireciona pra `meutrein.vercel.app`; usuário quer `meutrein.com.br`.

**Diagnóstico (confirmado lendo o código):**
- **NÃO é bug de código.** `signInWithProvider` usa `window.location.origin` (`hooks/use-auth.ts:160`) e o callback usa o `origin` da request (`app/auth/callback/route.ts:5`). Nenhum aponta pra vercel.app. Sem `vercel.json`, sem domínio hardcoded.
- **Causa raiz:** clássico **fallback do Site URL do Supabase**. Se o `redirectTo` (`https://meutrein.com.br/auth/callback`) NÃO estiver na allowlist de Redirect URLs do Supabase, o Supabase ignora e cai no **Site URL**, que está como `meutrein.vercel.app`.

**Correção (externa — Supabase Dashboard, eu NÃO consigo fazer daqui):**
- Authentication → URL Configuration:
  - **Site URL** → `https://meutrein.com.br` (ou `www`, ver alerta abaixo)
  - **Redirect URLs** → adicionar `https://meutrein.com.br/**` + `https://www.meutrein.com.br/**` (manter `https://meutrein.vercel.app/**` pra previews)
- Google Cloud Console NÃO precisa mexer (redirect URI aponta pro Supabase, não muda com domínio).

**⚠️ Inconsistência apex vs www (DECISÃO PENDENTE do usuário):**
- CLAUDE.md diz canônico = `www.meutrein.com.br`. Usuário pediu `meutrein.com.br` (apex). Fallbacks de `NEXT_PUBLIC_APP_URL` no código usam TODOS `www.` (`layout.tsx:37`, `sitemap.ts`, `robots.ts`, `opengraph-image`, `api/cron/.../inactivity`).
- **Perguntei:** alinhar código pra apex sem www (trocar fallbacks + `NEXT_PUBLIC_APP_URL` na Vercel + redirect www→apex), OU ficar com www (CLAUDE.md) e só ajustar Supabase? **Aguardando resposta.**

**Passo a passo ENTREGUE ao usuário (15:10):**
1. Descobrir qual domínio o site abre: digitar `meutrein.com.br` e ver se a barra fica no apex ou pula pra `www`.
2. Supabase Dashboard → Authentication → URL Configuration → Site URL = domínio do passo 1; Redirect URLs += `https://meutrein.com.br/**`, `https://www.meutrein.com.br/**`, manter `https://meutrein.vercel.app/**`.
3. Testar login Google pelo domínio certo.

**Próximos passos:**
- [ ] **AGUARDANDO usuário responder qual domínio apareceu no passo 1** (apex vs www) — trava o ajuste de código.
- [ ] Se o site abre no apex (`meutrein.com.br`): editar fallbacks de `www.meutrein.com.br` → `meutrein.com.br` no código (`layout.tsx:37,41`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `api/cron/.../inactivity:85`) + avisar pra setar `NEXT_PUBLIC_APP_URL` na Vercel. (Mexer em domínio = "só com aprovação explícita" — CLAUDE.md.)
- [ ] Usuário aplica a config no Supabase Dashboard (resolve o login independente da decisão de código).

**Arquivos tocados nesta rodada:** nenhum (só diagnóstico + entrega de instruções). `page.tsx` da rodada anterior segue modificado não-commitado.

**Como retomar:** nada editado. Esperando o usuário dizer se o site abre em `meutrein.com.br` (apex) ou `www.meutrein.com.br` (www) — isso decide se ajusto os fallbacks de domínio no código. O fix do login em si é 100% no Supabase Dashboard (Site URL + Redirect URLs).

## 2026-06-14 14:30 — BeforeAfterSection + TrustStrip adicionados à landing ✅

**Tarefa / objetivo:** adicionar seção "Antes × Depois" (caderno/Excel/zap → MeuTrein) e selos de confiança à landing, sem depender de imagens externas.

**Feito até agora:**
- `BeforeAfterSection` adicionada em `app/page.tsx`: dois cards lado a lado (Antes = borda vermelha + itens riscados; Com o MeuTrein = borda esmeralda + glow). Inserida entre `<StatsBar />` e `<FeaturesSection />`. Animação de entrada `x: -24 / +24`.
- `TrustStrip` adicionada: faixa fina com border-y contendo 5 selos (iPhone & Android, LGPD/Brasil, Stripe, Funciona sem internet, Suporte PT-BR). Inserida entre `<HowItWorksSection />` e `<PricingSection />` — exatamente onde o visitante considera comprar.
- `pnpm type-check` OK — sem erros de tipo.
- Git: `CHECKPOINT.md` e `page.tsx` modificados, **não commitados**.

**Próximos passos (do backlog de melhorias visuais):**
- [ ] **Screenshots REAIS do produto** — maior alavanca, mas **depende do usuário mandar os prints** (Playwright sem binário Ubuntu 26.04, Firefox headless travado). Criar galeria "Veja por dentro" quando tiver as imagens.
- [ ] **Prova social honesta** — depoimentos reais ou "as primeiras academias já estão usando" (sem claim inventado — regra do CLAUDE.md).
- [ ] **Polish pricing** — toggle mensal/anual + checkmarks comparando 3 planos lado a lado.
- [ ] Confirmar **@ real do Instagram** — placeholder `instagram.com/meutrein` em `Footer` (`SOCIALS`).
- [ ] **Seção 2 (Aulas/Turmas) — NÃO iniciada.** Aguarda 3 decisões (aulas fixas semanais; criar = dono+personal; reserva por ocorrência com lista de espera). Migration nova > 073 em PROD — avisar antes de aplicar.
- [ ] Avaliar resultado visual em http://localhost:3334/
- [ ] Commitar `page.tsx` (se usuário aprovar o visual).

**Arquivos tocados:**
- `GymFlow-main/apps/web/app/page.tsx` — `beforeItems[]`, `afterItems[]`, `BeforeAfterSection()`, `TRUST_BADGES[]`, `TrustStrip()` adicionados; render do `LandingPage` atualizado com `<BeforeAfterSection />` e `<TrustStrip />`.

**Pendências / decisões em aberto:**
- Usuário ainda não viu o resultado visual — aguarda avaliação.
- Instagram placeholder.
- Prints reais do produto (quando disponíveis → galeria "Veja por dentro").

**Como retomar:** as mudanças estão no working tree (`page.tsx` modificado, não commitado). Abrir http://localhost:3334/ para avaliar. Se dev server parou, rodar `doppler run -- pnpm --filter @gymflow/web dev` na raiz `GymFlow-main/`.

## 2026-06-14 13:45 — Backlog de melhorias visuais da landing (ideias dadas, aguardando escolha)

Avaliação: visual já bom (moderno, coeso, dark, motion). Falta **concretude e prova**, não enfeite. Ordem de impacto:
1. **Screenshots REAIS do produto** (seção "veja por dentro": dashboard dono, montar ficha, app aluno executando, gráfico evolução). Maior alavanca, mas **depende do usuário mandar os prints** (não consigo screenshot neste ambiente — firefox headless travado, playwright sem binário ubuntu 26.04).
2. **Prova social honesta** (depoimentos reais OU "as primeiras academias já estão usando" — SEM claim inventado, regra do projeto).
3. **"Antes × Depois"** (caderno/Excel/zap → MeuTrein). ← **recomendei começar por esta: 100% código, sem depender de imagem.**

Polish menor: nav que encolhe ao rolar; pricing com toggle mensal/anual + checkmarks comparando 3 planos; hover-lift/glow nos cards de feature; selos de confiança (iPhone/Android, LGPD/dados no Brasil, Stripe); bloco de 3 objeções curtas no topo; logos de pagamento.

**Pergunta pendente ao usuário:** fazer "Antes × Depois" + selos agora (em paralelo ele manda os prints pra galeria), ou começar por outra?

## 2026-06-14 13:40 — Git SINCRONIZADO com GitHub ✅

**Resolvido.** `git pull --no-rebase` (merge, ort) **sem conflitos** → merge `fb81065` → `git push` OK (`2103f41..fb81065`). `Branch_Jose` agora idêntico a `origin/Branch_Jose` (0 à frente / 0 atrás). Todo o trabalho da sessão (tema escuro 3%, whatsapp-fab.tsx, rodapé Smart Fit, Seção 1) está no GitHub.

**Único pendente de git:** `CHECKPOINT.md` aparece como `M` (modificado, não commitado) — é arquivo de trabalho local, não foi pro repo. Commitar só se o usuário pedir.

**Próximos passos do PRODUTO (inalterados):**
- [ ] Confirmar @ real do Instagram (placeholder `instagram.com/meutrein` no `Footer` → `SOCIALS`).
- [ ] **Seção 2 (Aulas/Turmas) — NÃO iniciada.** Aguarda 3 decisões (recom.: aulas fixas semanais; criar = dono+personal; reserva por ocorrência com lista de espera). Migration nova > 073 em PROD — avisar antes de aplicar.
- [ ] Avaliar tema escuro em http://localhost:3334/ (dev server bg ID `b2o8ngdo8` ainda rodando).
- [ ] Pendência externa: consent screen Google OAuth (App name "MeuTrein" + links privacidade/termos).

## 2026-06-14 10:40 — Tema mais escuro/contraste + security review

**Tarefa / objetivo:** (1) escurecer o tema com mais contraste, confortável p/ 12h de uso, sem cansar a vista; (2) rodar `/security-review` na branch.

**Feito até agora (working tree, NÃO commitado, NÃO deployado):**
- **Tema** em `app/globals.css` (`:root`): `--background` 4%→**3%** (mais escuro, tom 240→levemente +azul 16%); `--foreground` 95%→96%; `--surface-200/300` 14/18%→**15/19%** (degraus de elevação mais nítidos); `--muted-foreground` 55%→**63%** (texto secundário legível); `--border` 17%→**20%** (estrutura definida). `--card`/`--surface-50` mantidos em 8% → flutuam mais sobre o fundo 3%. **Lógica:** contraste veio da estrutura (bordas/cards/texto 2º), NÃO de texto branco puro (que causa halação/cansaço). Glows azul/roxo intactos.
- **Security review:** `/security-review` rodado. **Resultado: nenhuma vulnerabilidade** (≥8 confiança). Mudanças são client-side/CSS; links externos já têm `rel="noopener noreferrer"`; WhatsApp href é constante + `encodeURIComponent`; sem user input, sem `dangerouslySetInnerHTML`, sem backend/auth/crypto.
- Verificado: dev server (porta 3334, bg ID `b2o8ngdo8`) segue 200; CSS faz hot-reload.

**Próximos passos:**
- [ ] Usuário avaliar o tema escuro em http://localhost:3334/ (Ctrl+Shift+R). Ajuste fino = um valor: `--background` (mais/menos escuro) ou `--muted-foreground`/`--border` (mais/menos contraste de estrutura).
- [ ] **Confirmar @ real do Instagram** (placeholder `instagram.com/meutrein` em `Footer` → `SOCIALS`).
- [ ] **Seção 2 (Aulas/Turmas) — NÃO iniciada.** Espera 3 decisões (recomendações: aulas fixas semanais; criar = dono e personal; reserva por ocorrência com lista de espera). Mexe no banco PROD.
- [ ] Decidir: deixar local p/ ver OU deployar prod. Considerar commitar (tema + Smart Fit ainda só no working tree).

**Arquivos tocados nesta rodada:**
- `GymFlow-main/apps/web/app/globals.css` — tokens de cor do `:root` (tema escuro).
- (da rodada anterior, ainda no working tree) `app/page.tsx` + `components/marketing/whatsapp-fab.tsx` — WhatsApp FAB, rodapé Smart Fit, Seção 1 App.

**Como retomar:** as entregas (tema escuro + WhatsApp + rodapé + Seção 1) estão no working tree, não commitadas. Falta @ do Instagram e construir Seção 2 após as 3 decisões (migration nova > 073, `gen_random_uuid()`, RLS multi-tenant, RPC reserva atômica, `db:types`, telas; avisar antes de aplicar em prod).

## 2026-06-14 10:20 — Features inspiradas no Smart Fit (landing)

**Tarefa / objetivo:** o usuário quer trazer elementos do site da Smart Fit pro MeuTrein. Decidido (após eu alertar que copiar a pegada de rede grande conflita com o posicionamento "academia pequena"): **botão WhatsApp flutuante + rodapé estilo Smart Fit + Seção 1 (App do aluno) + Seção 2 (Aulas/Turmas com reserva)**.

**Feito até agora (3 de 4 — só na branch `Branch_Jose`, NÃO commitado, NÃO deployado):**
- **Botão flutuante WhatsApp** → número `5518991190939` (55+18+nº). Componente novo `components/marketing/whatsapp-fab.tsx` (exporta `WhatsAppFab`, `WhatsAppIcon`, `WHATSAPP_HREF` com mensagem pré-preenchida). Montado no fim do return da landing.
- **Rodapé repaginado** estilo Smart Fit em `page.tsx` `Footer()`: logo centralizada, bloco "Siga o MeuTrein" + ícones sociais (Instagram/WhatsApp/E-mail), colunas Produto/Empresa/Legal centralizadas, divisórias, bloco legal. Sem inventar CNPJ/endereço (regra de marca).
- **Seção 1 "App do aluno"** em `page.tsx` (`AppShowcaseSection` + `PhoneMockup`), inserida entre `FeaturesSection` e `PersonasSection`: mockup de celular (treino em execução) + lista de recursos + CTA "Começar grátis" (Link /cadastro, sempre visível) + `InstallButton` + dica QR. CTA primária foi adicionada porque `InstallButton` retorna `null` no Chrome desktop.
- **Verificação:** `pnpm --filter @gymflow/web type-check` OK; dev server (porta 3334) responde `/` 200; curl confirmou todos os textos novos no HTML ("palma da mão", "No celular do aluno", "Siga o MeuTrein", "5518991190939", "Funciona offline", "Sem loja de app"). Sem erros no log.

**Próximos passos:**
- [ ] **Confirmar @ real do Instagram** — está placeholder `instagram.com/meutrein` em `Footer` (`SOCIALS`). Trocar ou remover.
- [ ] **Seção 2 (Aulas/Turmas) — NÃO iniciada.** É feature nova de verdade: tabela(s) + RLS + RPC de reserva atômica (anti-overbooking) + telas dono/aluno. Mexe no banco de PROD (`db:push` aponta pra prod). Antes de escrever migration, esperando 3 decisões (recomendações minhas): (1) aulas **fixas semanais** vs data específica; (2) criar aula = **dono e personal**; (3) reserva por ocorrência **com lista de espera**. `agenda` atual é agendamento de ficha, NÃO turma — não reaproveita o modelo, só o padrão de página.
- [ ] Decidir: deixar rodando local p/ usuário ver OU deployar em prod (workflow do checkpoint antigo).

**Arquivos tocados:**
- `GymFlow-main/apps/web/components/marketing/whatsapp-fab.tsx` — **novo** (FAB + ícone + href WhatsApp).
- `GymFlow-main/apps/web/app/page.tsx` — imports (ícones lucide + WhatsApp comps); `AppShowcaseSection`/`PhoneMockup` novos; `<AppShowcaseSection/>` e `<WhatsAppFab/>` montados no return; `Footer()` reescrito.

**Pendências / decisões em aberto:**
- Instagram placeholder (acima).
- 3 decisões da Seção 2 (acima).
- **Sem screenshot neste ambiente:** Playwright sem binário pro Ubuntu 26.04; Firefox headless trava até em página trivial. Verificação foi via curl+grep. Usuário pode abrir http://localhost:3334/ no Firefox dele (dev server ficou rodando em background, ID `b2o8ngdo8`).

**Como retomar:** as 3 primeiras entregas estão no working tree (não commitadas). Falta: responder o @ do Instagram, e construir a Seção 2 após as 3 decisões — escrever migration nova (próximo número > 073, usar `gen_random_uuid()`), RLS multi-tenant, RPC `SECURITY INVOKER` de reserva, `pnpm db:types`, telas. Avisar antes de aplicar migration em prod.

## 2026-06-14 — Replicado no projeto (.claude) + trava anti-duplicação

**Tarefa / objetivo:** ter o checkpoint disponível global E versionado no repo ("nos dois"), e começar a aparar skills sem uso pra economizar tokens.

**Feito até agora:**
- Skill e script copiados para o projeto (committável): `.claude/skills/checkpoint/SKILL.md`, `.claude/hooks/checkpoint-context-check.py`.
- Hook `Stop` registrado em `.claude/settings.json` do projeto, usando `$CLAUDE_PROJECT_DIR`.
- Adicionada **trava atômica** (lock `O_EXCL` em /tmp por sessão+tokens) no script: evita disparo duplo quando o hook está registrado no global E no projeto. Testado: 1ª execução avisa, 2ª (mesmo Stop) silencia.
- Esclarecido um mal-entendido: **mais skills NÃO economiza tokens** — o "skill listing" custa por turno (~1% da janela). O ganho real é o ciclo checkpoint → `/clear`.

**Próximos passos:**
- [ ] **PENDENTE:** decidir quais skills desligar via `skillOverrides` (a pergunta foi interrompida). Opções dadas: só nicho / nicho+redundantes / mínimo absoluto / nada. Economia esperada <1% do contexto.
- [ ] Retomar o trabalho real do projeto.

**Arquivos tocados:**
- `~/.claude/hooks/checkpoint-context-check.py` — atualizado com a trava anti-duplicação.
- `GymFLow/.claude/hooks/checkpoint-context-check.py` — novo (cópia do projeto).
- `GymFLow/.claude/skills/checkpoint/SKILL.md` — novo (cópia do projeto).
- `GymFLow/.claude/settings.json` — novo (registro do hook `Stop` do projeto).

**Pendências / decisões em aberto:**
- `git status --short` voltou **vazio** agora (árvore limpa) — verificar se `.claude/` e `CHECKPOINT.md` estão no `.gitignore`, ou se as 3 mudanças soltas anteriores foram commitadas/revertidas entre turnos.
- Decisão de `skillOverrides` ainda não tomada.

**Como retomar:** o sistema de checkpoint está completo e ativo nos dois escopos (global + projeto), com proteção contra disparo duplo. Falta só responder qual conjunto de skills desligar (ou nenhum) e seguir com o projeto.

## 2026-06-14 — Skill /checkpoint + hook de contexto configurados

**Tarefa / objetivo:** criar um sistema de "checkpoint" que grava o estado do trabalho ao fim dos prompts e, principalmente, quando o contexto passa de 30% da janela do modelo.

**Feito até agora:**
- Skill `/checkpoint` criada em `~/.claude/skills/checkpoint/SKILL.md` (grava/atualiza este arquivo).
- Hook `Stop` em `~/.claude/hooks/checkpoint-context-check.py` que estima o contexto pelo transcript e pede o checkpoint quando ≥ 30%.
- Hook ligado em `~/.claude/settings.json` (preservando `model`/`effortLevel`).
- Testado: ≥30% → `decision:block`; <30% → silêncio; `stop_hook_active` → anti-loop. O hook disparou sozinho a ~37%, confirmando que está ativo.

**Próximos passos:**
- [ ] (opcional) Decidir escopo: manter global (`~/.claude/`) ou restringir só a este projeto.
- [ ] (opcional) Ajustar destino do `CHECKPOINT.md` (raiz vs `.claude/`) ou o texto do lembrete.
- [ ] Retomar o trabalho real do projeto (havia mudanças soltas não relacionadas: `globals.css`, `social-buttons.tsx`, `next.config.ts`).

**Arquivos tocados (config, fora do repo):**
- `~/.claude/skills/checkpoint/SKILL.md` — instruções da skill.
- `~/.claude/hooks/checkpoint-context-check.py` — lógica do hook.
- `~/.claude/settings.json` — registro do hook `Stop`.

**Pendências / decisões em aberto:**
- Limite atual: 30% (`CHECKPOINT_THRESHOLD_PCT`). Janela assumida: 200000 tokens.
- Mudanças soltas no repo (`globals.css`, `social-buttons.tsx`, `next.config.ts`) são de antes desta tarefa e não foram tocadas aqui.

**Como retomar:** o sistema de checkpoint já está pronto e ativo. Para evoluir o projeto em si, olhar as 3 mudanças pendentes no `git status`. Para mexer no checkpoint, editar os arquivos em `~/.claude/`.
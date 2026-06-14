# Checkpoint

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
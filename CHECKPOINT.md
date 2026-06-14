# Checkpoint

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

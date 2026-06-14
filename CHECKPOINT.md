# Checkpoint

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

---
name: checkpoint
description: Grava/atualiza um arquivo de progresso (CHECKPOINT.md) com o estado atual do trabalho — tarefa, o que já foi feito, próximos passos, arquivos tocados e pendências. Use ao fim de um trecho de trabalho, antes de um /compact ou /clear, ou quando o contexto ficar grande, para conseguir retomar depois sem perder o fio.
---

# Checkpoint

Salve o estado atual da sessão num arquivo de progresso versionável, para que o trabalho possa ser retomado mesmo depois de um `/compact`, `/clear` ou de fechar a sessão.

## O que fazer

1. **Localize o arquivo.** Escreva em `CHECKPOINT.md` na raiz do projeto (o diretório de trabalho atual). Se já existir, **atualize-o** em vez de recomeçar do zero — preserve o histórico de checkpoints anteriores.

2. **Reúna o estado real** a partir do que aconteceu na conversa até agora. Não invente: descreva o que de fato foi feito. Se útil, rode `git status --short` e `git diff --stat` para listar os arquivos mexidos.

3. **Escreva/atualize o arquivo** com esta estrutura (adicione um novo bloco no topo a cada checkpoint, mantendo os anteriores abaixo):

   ```markdown
   # Checkpoint

   ## <AAAA-MM-DD HH:MM> — <título curto do estado>

   **Tarefa / objetivo:** o que estamos tentando fazer.

   **Feito até agora:**
   - ...

   **Próximos passos:**
   - [ ] ...

   **Arquivos tocados:**
   - `caminho/arquivo` — o que mudou e por quê.

   **Pendências / decisões em aberto:**
   - ...

   **Como retomar:** 1-2 frases para um Claude futuro continuar daqui.
   ```

4. **Seja conciso.** O objetivo é caber em pouco contexto e ser fácil de reler. Foque no que não dá para reconstruir só lendo o código ou o `git log`.

5. **Confirme** numa linha onde salvou e quantos checkpoints o arquivo tem agora.

## Observações

- Não faça commit nem `git add` automaticamente — o arquivo é versionável, mas quem decide commitar é o usuário.
- Este checkpoint é disparado automaticamente pelo hook `Stop` quando o contexto passa de 30% da janela do modelo (configurável). Você também pode rodar `/checkpoint` manualmente a qualquer momento.
- Para mudar o limite de disparo, ajuste `CHECKPOINT_THRESHOLD_PCT` (env) ou edite o script `checkpoint-context-check.py` em `.claude/hooks/` (projeto) ou `~/.claude/hooks/` (global).

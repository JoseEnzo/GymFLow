#!/usr/bin/env python3
"""Stop hook: guarda de contexto para o /checkpoint.

Lê o JSON do hook em stdin. Estima o tamanho do contexto atual a partir do
transcript da sessão e, quando passa de CHECKPOINT_THRESHOLD_PCT% da janela do
modelo, pede para o Claude rodar a skill /checkpoint antes de encerrar.

O campo `stop_hook_active` garante no máximo UM lembrete por turno (sem loop
infinito): no primeiro Stop o hook bloqueia e pede o checkpoint; o Claude
continua, salva e para de novo — aí `stop_hook_active` é True e o hook sai limpo.

Além disso há uma trava atômica por sessão: se o mesmo Stop disparar o hook mais
de uma vez (ex.: registrado no settings global E no do projeto), só a primeira
instância emite o lembrete.

Config por env var (opcional):
  CHECKPOINT_CONTEXT_WINDOW  janela de contexto em tokens (default 200000)
  CHECKPOINT_THRESHOLD_PCT   limite em % para disparar (default 30)
"""
import json
import os
import sys
import tempfile


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return  # entrada malformada: não faz nada

    # Evita loop: se já estamos continuando por causa de um stop hook, encerra.
    if data.get("stop_hook_active"):
        return

    transcript_path = data.get("transcript_path")
    if not transcript_path or not os.path.exists(transcript_path):
        return

    window = int(os.environ.get("CHECKPOINT_CONTEXT_WINDOW", "200000"))
    threshold_pct = float(os.environ.get("CHECKPOINT_THRESHOLD_PCT", "30"))
    threshold = window * threshold_pct / 100.0

    # Pega o último bloco de usage do transcript (= contexto do turno atual).
    tokens = 0
    try:
        with open(transcript_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except Exception:
                    continue
                msg = entry.get("message")
                usage = msg.get("usage") if isinstance(msg, dict) else None
                if usage is None:
                    usage = entry.get("usage")
                if isinstance(usage, dict):
                    t = (
                        (usage.get("input_tokens") or 0)
                        + (usage.get("cache_read_input_tokens") or 0)
                        + (usage.get("cache_creation_input_tokens") or 0)
                    )
                    if t:
                        tokens = t  # mantém o último não-zero
    except Exception:
        return

    if tokens < threshold:
        return

    # Trava anti-duplicação: se o hook estiver registrado em mais de um settings
    # (global + projeto), ambos rodam no mesmo Stop. A criação atômica (O_EXCL)
    # da lock garante que só o primeiro processo avise. A chave inclui os tokens,
    # então cada novo turno (contexto diferente) volta a avisar normalmente.
    session_id = str(data.get("session_id", "nosession"))
    lock = os.path.join(
        tempfile.gettempdir(), f"claude-checkpoint-{session_id}-{tokens}.lock"
    )
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.close(fd)
    except FileExistsError:
        return  # outra instância do hook já avisou neste mesmo Stop
    except OSError:
        pass  # sem lock possível: segue e avisa mesmo assim

    pct = tokens * 100 // window
    reason = (
        f"⚑ Contexto em ~{pct}% (~{tokens} tokens), acima do limite de "
        f"{int(threshold_pct)}%. Antes de encerrar, rode a skill /checkpoint "
        f"para gravar/atualizar o CHECKPOINT.md com o estado atual do trabalho, "
        f"os próximos passos e os arquivos tocados. Depois de salvar, pode "
        f"encerrar normalmente."
    )
    print(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))


if __name__ == "__main__":
    main()

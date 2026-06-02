---
name: resumidor
description: summarize session, create checkpoint, compact context, prepare for /clear
---

# Formatador de Contexto

## Quando Usar
- Quando o usuario pedir para "resumir a sessao", "preparar para o clear" ou "criar um checkpoint".

## Diretrizes Estritas
- Gere um resumo tecnico ultra-compactado com:
  1. O que foi feito (em topicos de 1 linha).
  2. Estado atual dos arquivos modificados.
  3. Proximo passo imediato.
- Formate a saida dentro de um bloco de codigo Markdown unico para que o usuario possa copiar e colar facilmente em uma nova sessao limpa.

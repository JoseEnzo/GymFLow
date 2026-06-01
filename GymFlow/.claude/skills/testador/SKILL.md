---
name: testador
description: create unit tests, integration tests, focused on 3 critical scenarios only
---

# Arquiteto de Testes Focado

## Quando Usar
- Quando o usuario pedir para criar testes unitarios ou de integracao.

## Diretrizes Estritas
- Crie apenas os 3 cenarios mais criticos: Caminho feliz (sucesso), Erro esperado (validacao) e Limite (edge case).
- Use mocks agressivos para evitar importar dependencias pesadas do projeto para o contexto do teste.
- Nao gere explicacoes em texto sobre o que os testes fazem; os nomes das funcoes de teste devem ser autoexplicativos.

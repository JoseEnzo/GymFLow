# Diretrizes do Projeto GymFlow

## Comportamento Automático e Economia de Tokens
Você deve agir como um agente autônomo focado em máxima eficiência e economia de contexto. Adote as seguintes posturas automaticamente em todas as interações:

1. **Alterações de Código:** Sempre que for modificar arquivos existentes, aplique estritamente as regras da skill `.claude/skills/cirurgiao/SKILL.md`. Use apenas diffs cirúrgicos e nunca reescreva arquivos inteiros.
2. **Novos Componentes:** Sempre que o usuário pedir para criar um componente visual, siga o padrão definido em `.claude/skills/new-component/SKILL.md`.
3. **Novas Páginas/Rotas:** Sempre que o usuário pedir para criar uma nova tela ou rota no Next.js, siga o padrão de `.claude/skills/new-page/SKILL.md`.
4. **Criação de Testes:** Sempre que for criar testes, siga estritamente as regras da skill `.claude/skills/testador/SKILL.md` (foco em 3 cenários críticos e uso de mocks).
5. **Estilo de Resposta:** Vá direto ao ponto. Elimine saudações, cortesias e explicações teóricas longas, a menos que seja explicitamente perguntado o motivo.

## Atalhos e Rotinas de Prompt (Economia Extrema)
- **Quando o usuário digitar apenas "preparar checkpoint" ou "checkpoint":** Acione imediatamente a skill `.claude/skills/resumidor/SKILL.md`. Gere o bloco markdown ultra-compactado com o estado atual e instrua o usuário a usar `/clear` e colar o bloco a seguir.

## Comandos Úteis do Projeto
- Instalar dependências: `pnpm install`
- Rodar o ambiente de desenvolvimento: `pnpm dev`
- Executar build: `pnpm build`
- Executar rotinas integradas: Use a skill `.claude/skills/run-gymflow/SKILL.md`
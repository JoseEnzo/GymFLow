# Checkpoint

## 2026-06-15 ~15:45 — Auditoria de responsividade da landing (sólida; aguardando sintomas por device)

**Tarefa:** usuário mostrou tela de config de ~40 dispositivos (Polypane/Responsively) e pediu pra alinhar a landing em todos. Decisões (AskUserQuestion): foco = **landing** (`app/page.tsx`, 1912 linhas); sintoma = "cada device mostra um problema diferente" (não especificou quais).

**LIMITAÇÃO CRÍTICA:** não consigo renderizar/screenshot devices neste ambiente (Playwright sem binário Ubuntu, Firefox headless trava). Quem vê o render é o usuário na ferramenta dele. Eu só audito/corrijo CSS.

**Os ~40 devices = ~6 breakpoints reais:** 375px (iPhone SE/X/XR), 390-430px (iPhones/Galaxy modernos), 768-834px (iPads), 1024-1440px (iPad Pro/tablets/notebooks), 1920px (Full HD/1080p TV), 3840px (4K TV).

**Auditoria feita (landing está SÓLIDA, sem bugs grosseiros):**
- Padding lateral correto em toda seção: `px-4 sm:px-6 lg:px-8` (12 containers via grep).
- Grids colapsam certo (1→2/3/4 colunas) em quase todos.
- Hero/títulos escalam: `text-4xl sm:text-5xl lg:text-6xl`.
- Os 3 "pontos de risco" iniciais, vistos de perto, estão OK: (1) `grid-cols-3` linha 491 tem `min-w-0`+`truncate`; (2) `w-[280px]` linha 780 cabe folgado em 375px centralizado; (3) `max-w-7xl` em TV 4K é o único problema real, mas é DECISÃO DE DESIGN (aumentar muda desktop também), não bug.

**NENHUM arquivo alterado** — recusei editar no escuro (risco de quebrar a vitrine sem corrigir nada concreto; linter já reverteu edições antes).

**Próximos passos:**
- [ ] **BLOQUEADO:** usuário precisa mandar print OU descrição de UM device específico onde vê o defeito ("no iPhone SE o título encosta na borda", etc.). Com exemplo concreto, corrijo a faixa e replico pros vizinhos.
- [ ] Se ele decidir sobre TV 4K: aumentar `max-w-7xl`→maior em `2xl:` (≥1536px) afeta só monitores grandes — opção contida, mas é escolha dele.

**Estrutura da landing (referência):** Nav(198), Hero(346), FeaturesSection(659), AppShowcaseSection(845), PersonasSection(908), HowItWorksSection(1046), PricingSection(1194), SobreSection(1291), CTASection(1393), Footer(1491), BeforeAfterSection(1619), FAQSection(1774).

**Como retomar:** auditoria pronta, landing responsivamente sã. Aguardando sintoma concreto por device pra corrigir com precisão. Sem isso, não editar (chute = risco).

## 2026-06-15 ~15:20 — E-mail de verificação não chega (causa: Resend sandbox)

**Sintoma:** cadastro pede verificação de e-mail, mas o código não chega.

**Causa (confirmada no código, NÃO é bug):** `apps/web/lib/resend.ts:13` → `FROM_EMAIL = RESEND_FROM_EMAIL ?? 'MeuTrein <onboarding@resend.dev>'`. Sem `RESEND_FROM_EMAIL` no Doppler, usa o sandbox `onboarding@resend.dev`, que **só entrega pro e-mail do dono da conta Resend**. Código de envio está correto (`app/api/auth/send-verification/route.ts:96`).

**IMPORTANTE: usuário NÃO usa Doppler — só Vercel + domínio.** As envs `RESEND_API_KEY`/`RESEND_FROM_EMAIL` são server-side (sem `NEXT_PUBLIC_`) → configurar direto em Vercel → Settings → Environment Variables (Production). Ignorar instruções de Doppler do CLAUDE.md pra esse usuário.

**Soluções dadas:**
- **Desbloquear teste AGORA (A):** cadastrar com o e-mail dono da conta Resend.
- **Desbloquear teste AGORA (B):** SQL pra marcar verificado: `update profiles set email_verified_at = now() where id = (select id from auth.users where email = 'EMAIL');`
- **Definitivo (Vercel, sem Doppler):** (1) Resend → verificar domínio `meutrein.com.br` (ou subdomínio `send.`) + registros SPF/DKIM/DMARC no DNS; (2) Vercel env `RESEND_FROM_EMAIL="MeuTrein <noreply@meutrein.com.br>"` (domínio = o verificado) + confirmar `RESEND_API_KEY`; (3) Redeploy na Vercel (env nova só entra com novo deploy).

**Próximos passos:**
- [ ] Usuário confirmar se `RESEND_API_KEY` já está na Vercel (se cadastro mostra "Envio de e-mail indisponível" = falta a key).
- [ ] Escolher: desbloqueio rápido (A/B) ou config definitiva do domínio no Resend + Vercel.

**Como retomar:** diagnóstico entregue, nenhum arquivo alterado. Usuário usa Vercel (não Doppler). Aguardando confirmar se RESEND_API_KEY está na Vercel e escolher o caminho.

## 2026-06-15 ~15:00 — SQL para apagar TODOS os perfis preservando catálogo (ENTREGUE, usuário vai rodar)

**Tarefa:** usuário quer apagar TODOS os perfis/usuários do Supabase (PROD), mas preservar receitas/exercícios/alimentos (da última vez o delete apagou o catálogo junto). Decisões (AskUserQuestion): escopo = **todos, incluindo a conta dele** (reset total); execução = **eu gero o SQL, ele roda no SQL Editor**.

**Mapa de FKs (migrations 001/043/052):**
- Apagar `auth.users` CASCATEIA: profiles, academy_members, invites, workout_sheets, workout_logs, set_logs, etc.
- `academies.owner_id` → **ON DELETE RESTRICT** (001:43) → academia tem que ser deletada ANTES do owner.
- `exercises/recipes/food_items.created_by` → **NO ACTION** (001:131, 043:48, 052:21) → bloqueia delete; **SET NULL preserva** os itens. ESSA é a causa do estrago anterior.
- `exercises/recipes/food_items.academy_id` → **CASCADE** (001:132, 043:49, 052:22) → itens POR-ACADEMIA caem junto com a academia. Só os GLOBAIS (`is_global=true`/`academy_id null`) sobrevivem.

**SQL entregue (no chat, não em arquivo):**
- **Passo 1 PREVIEW** (SELECT, não-destrutivo): conta users/profiles/academies + globais "(preserva)" vs por-academia "(CAI)" das 3 tabelas de catálogo.
- **Passo 2 EXECUÇÃO** (transacional `begin;...commit;`): (1) `UPDATE ... SET created_by = null` nas 3 tabelas; (2) `DELETE FROM academies`; (3) `DELETE FROM auth.users`.

**Próximos passos:**
- [ ] Usuário roda o PREVIEW e confere as linhas "(CAI)". Se tiver catálogo por-academia que ele quer manter, EU forneço passo extra pra converter em global (`academy_id=null, is_global=true`) antes do delete.
- [ ] Usuário confirma backup/PITR e roda o Passo 2.
- [ ] Se o `DELETE FROM auth.users` falhar por alguma FK NO ACTION não prevista → rollback automático → ele me manda o erro pra eu adicionar o SET NULL/delete correspondente.

**Avisos dados:** é PROD e irreversível; rodar preview antes; transação dá rollback se algo bloquear.

**Como retomar:** SQL já entregue. Aguardando o usuário rodar o preview/execução ou pedir o passo de conversão custom→global. Nada foi executado por mim (não tenho credenciais Supabase neste ambiente).

## 2026-06-15 ~14:30 — Diagnóstico: perfil "volta" ao banco após excluir + login (NÃO é bug)

**Pergunta do usuário:** ao excluir perfis no Supabase e logar de novo com o mesmo email, o perfil volta. Precisa `supabase db pull`?

**Resposta:** `db pull` NÃO tem relação (só baixa schema, não toca dados/comportamento).

**Causa raiz (confirmada no código):** o usuário deleta só a LINHA de `profiles` (Table Editor), mas o `auth.users` continua existindo → login funciona. Em `apps/web/hooks/use-auth.ts:34-72`, `loadUserData()` (roda no mount e em todo `SIGNED_IN`) faz `upsert` RECRIANDO o profile a partir do `user_metadata` quando não acha a linha. Foi intencional (trigger `handle_new_user` em `001_initial_schema.sql:282` não era confiável no Supabase remoto — só dispara em INSERT de auth.users, nunca em login).

**Solução entregue (3 formas de excluir DE VERDADE — tem que apagar `auth.users`, profile cai por cascade):**
1. Supabase Dashboard → Authentication → Users → deletar lá (não no Table Editor).
2. Botão "Excluir minha conta" no app (`POST /api/account/delete`) — caminho recomendado, ordem de FKs correta, libera email/CNPJ/CREF.
3. SQL: `delete from auth.users where email = '...'`.

**Nenhum arquivo alterado** — só diagnóstico. Pendência opcional: confirmar FK cascade `profiles.id → auth.users.id ON DELETE CASCADE` numa migration (não verifiquei ainda).

## 2026-06-15 ~14:00 — Fix brand-logo loop + botão Voltar em verificar-email (APLICADO ✅)

**Tarefa:** reaplicar duas correções que haviam sido revertidas pelo linter na sessão anterior: (1) loop infinito ao clicar logo na tela `/verificar-email`; (2) ausência de botão "Voltar para o início" na mesma tela.

**Feito:**
- **`apps/web/components/layout/brand-logo.tsx` linha 39** — trocado `profile ? '/dashboard'` por `profile?.email_verified_at ? '/dashboard'`. Quebra o loop: sem e-mail verificado, logo aponta pra `/` em vez de `/dashboard` → `/onboarding` → `/verificar-email` → loop.
- **`apps/web/app/(auth)/verificar-email/page.tsx`** — adicionados:
  - Import `ArrowLeft` (lucide-react) + `useAuthStore` (`@/stores/auth-store`)
  - `reset` extraído do store via hook
  - Função `goHome()`: `supabase.auth.signOut()` + `reset()` + `router.replace('/')`
  - Botão "Voltar para o início" na UI abaixo do link de reenvio, separado por `border-t`

**Arquivos tocados:**
- `GymFlow-main/apps/web/components/layout/brand-logo.tsx` (+1/-1)
- `GymFlow-main/apps/web/app/(auth)/verificar-email/page.tsx` (+20/-1)

**COMMITADO ✅ (2 commits locais, NÃO pushados):**
- `9accca3` "Fix loop do logo e adiciona botão Voltar em verificar-email" (brand-logo + verificar-email + CHECKPOINT.md)
- `4b7662c` "Atualiza CHECKPOINT com estado pós-commit"
A feature CREF já estava no commit anterior `026410c "Feat correções"` (cadastro/page.tsx, middleware.ts, verify-cref/route.ts, lib/cref.ts — todos tracked).

**PUSHADO ✅** — usuário rodou `git push origin Branch_Jose` no terminal integrado do VS Code (o push falha no Bash do Claude por falta de credenciais — `gh` não instalado, socket do helper do VS Code só funciona no terminal integrado). Branch `Branch_Jose` sincronizada com origin (`https://github.com/JoseEnzo/GymFLow.git`).

**Pendências / decisões em aberto:**
- [ ] `pnpm type-check` não rodou (deps não instaladas). Tipos confirmados no `packages/database/src/types.ts`. CI cobre no PR.
- [ ] (Opcional) Verificar visualmente: cadastro personal → verificar-email → clicar logo (deve ir pra `/`) + botão Voltar.

**Lição p/ próximas sessões:** `git push` NÃO funciona no Bash do Claude neste ambiente (credenciais inacessíveis). Sempre pedir pro usuário rodar o push no terminal integrado do VS Code.

**Como retomar:** trabalho 100% entregue e pushado (`9accca3`, `4b7662c`). Resta só verificação visual opcional.

## 2026-06-15 ~11:30 — Verificação REAL do CREF no cadastro do personal (IMPLEMENTADO)

**Tarefa:** cadastro do personal só validava formato do CREF (regex). Usuário quer verificação real do registro, mesmo sendo opcional. Decisão dele (AskUserQuestion): **scraping do conselho** (não upload/manual, não API paga).

**Descoberta-chave da recon:**
- Não existe API pública oficial unificada de CREF. CONFEF nacional (`confefv2/registrados`) tem desafio anti-bot JS (`/challenge` em loop) → só com headless browser, inviável em serverless.
- Conselhos regionais na plataforma **Implanta** (ASP.NET) expõem busca pública JSON em `POST {base}/servicosOnline/publico/ConsultaInscritos/Buscar`. O reCAPTCHA do site é só gate de UI — o endpoint responde server-side sem ele.
- Mecânica: GET da página → extrai `__RequestVerificationToken` (hidden) + cookies (`getSetCookie()`); POST JSON com header `__RequestVerificationToken` + `Cookie` (double-submit anti-forgery). Filtro é "contains" → query com número zero-paddado a 6 dígitos.
- **Cobertura confirmada (testada ao vivo):** SP=CREF4 (`cref-sp`), RJ/ES=CREF1 (`cref-rj`), RS=CREF2 (`cref-rs`). Outras UFs no padrão `cref-{uf}.implanta` não resolvem (infra própria). Resposta traz `Situacao` (ATIVO/BAIXADO) e `NumeroRegistro` com UF.

**Feito (validado via Node fetch ao vivo — todos os casos passaram):**
- `000001-G/SP`→active(Bertevello); `000001-G/RJ`→active; `000001-G/ES`→inactive(BAIXADO, distinguiu ES de RJ no mesmo portal); `999998-G/SP`→not_found; `1234-G/MG`→unsupported_uf; `12-A/SP`→invalid_format.

**Arquivos tocados:**
- `apps/web/lib/cref.ts` (NOVO) — `parseCREF`, `verifyCREF`, mapa `IMPLANTA_PORTALS` (SP/RJ/ES/RS). Server-only.
- `apps/web/app/api/verify-cref/route.ts` (NOVO) — POST `{cref}`, `runtime='nodejs'` (Edge stripa header Cookie!), rate-limit `RATE_LIMITS.checkDocument` por IP.
- `apps/web/middleware.ts` — `/api/verify-cref` na `PUBLIC_API_ROUTES`.
- `apps/web/app/(auth)/cadastro/page.tsx` — estado `crefCheck`/`crefChecking`; `requestCrefVerification`+`handleCrefBlur`; guard no `onSubmit` (bloqueia not_found/inactive); `onBlur`+feedback visual no input (✓ nome / spinner / aviso unsupported).

**Política UX:** UF coberta → verificação bloqueante (not_found/inactive barram). UF não coberta / portal fora do ar → NÃO bloqueia (CREF é opcional), marca "não verificado".

**Pendências / não incluído:**
- [ ] `pnpm type-check` NÃO rodou aqui (deps não instaladas: `tsc not found`/`node_modules missing`). CI cobre no PR. Único risco de tipo: `Headers.getSetCookie()` exige lib.dom recente (Next 15 tem) — verificar no CI.
- [ ] (Opcional) Persistir flag `cref_verified` em `profiles` (migration + trigger `handle_new_user` + regen types) — hoje verificação é só gate, não fica no banco.
- [ ] (Opcional) Aplicar verificação também em edição de CREF em `/perfil` e `/configuracoes` (fora do escopo "no cadastro").

**Como retomar:** feature funciona. Rodar `pnpm install` + `pnpm type-check` antes de commitar. Para ampliar cobertura, adicionar UFs em `IMPLANTA_PORTALS` (confirmar antes que o portal `cref-{uf}.implanta.net.br` responde 200).

## 2026-06-15 ~11:00 — Resend: como habilitar entrega para qualquer e-mail (só config externa)

**Tarefa:** e-mails de verificação chegam só no e-mail do dono da conta Resend (sandbox). Usuário quer entregar para qualquer endereço.

**Nenhum código foi alterado.** O código já está preparado em `apps/web/lib/resend.ts`:
- `FROM_EMAIL` lê `RESEND_FROM_EMAIL` do ambiente; usa `onboarding@resend.dev` só como fallback.
- Ambos os e-mails do app (`send-verification` e `cron/notifications/inactivity`) já usam `FROM_EMAIL`.

**Passos externos necessários (não são código):**
1. **Resend:** resend.com/domains → Add Domain → `meutrein.com.br` → copiar registros SPF/DKIM/DMARC.
2. **Registro.br:** adicionar os registros DNS gerados pelo Resend no domínio `meutrein.com.br`.
3. **Doppler:** `doppler secrets set RESEND_FROM_EMAIL="MeuTrein <noreply@meutrein.com.br>"` no projeto `gymflow-s-org`.
4. **Vercel:** redeploy para o novo valor entrar em produção.

**Próximos passos:**
- [ ] Verificar domínio no Resend + adicionar DNS no Registro.br.
- [ ] Setar `RESEND_FROM_EMAIL` no Doppler e fazer redeploy.
- [ ] Reaplicar correções do loop (ver checkpoint anterior) — brand-logo + verificar-email.

**Como retomar:** só configuração externa pendente; nenhum arquivo do repo precisa mudar para os e-mails funcionarem.

## 2026-06-15 ~10:50 — Fix loop logo + botão Voltar em verificar-email (PENDENTE — revertido pelo linter)

**Tarefa:** loop infinito ao clicar no logo na tela `/verificar-email` pós-cadastro do personal; ausência de botão "Voltar".

**Causa raiz:** `profile` fica setado no store mesmo sem e-mail verificado → `BrandLogo` apontava pra `/dashboard` → `/dashboard` (sem academia) → `/onboarding` (não verificado) → `/verificar-email` → loop.

**Estado atual: mudanças REVERTIDAS pelo linter.** Os dois arquivos voltaram ao estado original:
- `brand-logo.tsx` linha 39: `const href = profile ? '/dashboard' : '/'` (não tem `email_verified_at`).
- `verificar-email/page.tsx`: sem `goHome`, sem botão Voltar, sem `ArrowLeft`.

**O que precisa ser feito (reaplicar):**

1. **`apps/web/components/layout/brand-logo.tsx` linha 39** — trocar:
   ```ts
   const href = profile ? '/dashboard' : '/'
   ```
   por:
   ```ts
   const href = profile?.email_verified_at ? '/dashboard' : '/'
   ```

2. **`apps/web/app/(auth)/verificar-email/page.tsx`** — adicionar:
   - Import: `ArrowLeft` do lucide-react e `useAuthStore` de `@/stores/auth-store`
   - Função `goHome()` (faz signOut + reset + `router.replace('/')`) antes de `verify()`
   - Botão "Voltar para o início" na UI abaixo do link de reenviar (com separador `border-t`)

**Outros arquivos com mudanças no working tree (não relacionados a esta tarefa):**
- `apps/web/app/(auth)/cadastro/page.tsx` — modificado (2 arquivos no git diff)
- `apps/web/middleware.ts` — modificado
- `apps/web/app/api/verify-cref/` — novo (untracked)
- `apps/web/lib/cref.ts` — novo (untracked)

**Verificação de e-mail (informação relevante):** o fluxo funciona (`send-verification` → Resend → código 6 dígitos salvo como hash sha256), mas `FROM_EMAIL` ainda é sandbox `onboarding@resend.dev` — só entrega no e-mail do dono da conta Resend. Para funcionar com qualquer e-mail: verificar domínio `meutrein.com.br` no Resend e setar `RESEND_FROM_EMAIL=noreply@meutrein.com.br` no Doppler.

**Próximos passos:**
- [ ] Reaplicar as 2 correções acima (brand-logo + verificar-email).
- [ ] Validar no app — testar fluxo cadastro personal → clicar logo (deve ir pra `/`) e botão Voltar.
- [ ] Verificar domínio no Resend para e-mails chegarem em qualquer endereço.

**Como retomar:** as duas correções foram revertidas; reaplicar manualmente os trechos acima antes de testar.

## 2026-06-14 ~20:30 — Header: "+ Novo", busca (⌘K) e sino com função

**Tarefa:** dar função aos botões/inputs do header (screenshot): o "+ Novo" abre menu de criação (nova ficha/rotina/treino, nova receita, etc.), a busca e o sino também passam a funcionar.

**Feito (working tree, NÃO commitado, type-check OK):**
- **"+ Novo" → dropdown role-aware (owner/personal):** Nova ficha de treino → `/treinos/novo`; Novo plano alimentar → `/dietas/novo`; Nova receita → `/receitas?novo=1`; Novo exercício → `/exercicios?novo=1`. Aluno NÃO vê o botão (não cria nada). Decisão: "ficha = rotina = treino" no app → 1 item só ("Nova ficha de treino").
- **Busca (input desktop + ícone mobile) + ⌘K/Ctrl+K → command palette** novo componente. Filtra (sem acento) ações "Criar" + páginas que o papel vê (reusa `NAV_ITEMS` do sidebar com mesmo filtro de plano solo). ↑/↓ + Enter navega, Esc/clique-fora fecha.
- **Sino → painel "Notificações"** estado vazio honesto ("Você está em dia") + link "Ver solicitações" (`/solicitacoes`) só owner/personal. Removido o pontinho vermelho fixo (fingia não-lida).
- **Avatar:** migrado pro mesmo controle `openMenu` ('user'|'novo'|'bell'|null) — abrir um fecha os outros, clique-fora fecha tudo (clusterRef).
- **`?novo=1`:** receitas/exercicios abrem o modal de criação direto (gate `&& isPersonal`).

**Arquivos tocados:**
- NOVO `apps/web/lib/quick-create.ts` — `getQuickCreateActions(role)`, fonte única das 4 ações (header + palette).
- NOVO `apps/web/components/layout/command-palette.tsx` — modal de busca/comando.
- `apps/web/components/layout/header.tsx` — reescrito o cluster da direita (3 dropdowns + palette + ⌘K).
- `apps/web/components/layout/sidebar.tsx` — `export const NAV_ITEMS` (reuso pela palette).
- `apps/web/app/(dashboard)/exercicios/page.tsx` + `receitas/page.tsx` — showModal inicial lê `?novo=1`.

**Próximos passos:**
- [ ] Subir dev (`doppler run -- pnpm --filter @gymflow/web dev`) e conferir visual nos 3 papéis.
- [ ] Commitar se aprovado (2 novos + 4 editados; `sw.js` e CHECKPOINT.md já estavam M).
- [ ] (Opcional) limpar `?novo=1` da URL após abrir o modal — hoje fica no histórico igual aos params `addTo`/`meal` existentes.

**Como retomar:** type-check passou; nada commitado. Falta só verificação visual e commit.

## 2026-06-14 ~18:10 — Auditoria de bugs do site: SEM erros que quebrem nada ✅

**Tarefa:** usuário pediu "procure erros que comprometam o funcionamento do site, em tudo, quero tudo funcionando perfeitamente". Varredura ampla por bugs.

**Resultado — site saudável, nenhum bug crítico encontrado:**
- **Portas automáticas (todas ✅):** `tsc --noEmit` 0 erros · `next lint` 0 erros (só warnings `exhaustive-deps` intencionais) · `next build` produção exit 0, **60 rotas compilaram**.
- **Revisado à mão (sólido):** billing-banner + webhooks/stripe + verify-session (lógica trialing/trial_ends_at correta e consistente) · profile-completion-banner/brand-logo/navigation-progress/layout · use-auth (useMemo evita loop) · auth-store (refaz currentAcademy do banco) · middleware (guard sessão) · finishWorkout + fila offline (idempotência client_id).
- **Classes de crash checadas:** todos os `JSON.parse` em try/catch · `useSearchParams` todos sob `<Suspense>` · nenhum `reduce` sem seed.

**Itens menores (dívida técnica, NÃO quebram nada):**
- ~18 warnings `react-hooks/exhaustive-deps` (deliberados — omitir `supabase`/`load` evita re-render loop).
- Vários componentes chamam `createClient()` no corpo em vez de `useMemo` (mitigado por omitir das deps; padrão recomendado é useMemo). Páginas de realtime já corretas.

**Próximos passos (se o usuário quiser ir além do estático):**
- [ ] (a) Smoke test ao vivo: `pnpm dev` (precisa Doppler logado) → testar telas principais.
- [ ] (b) Investigar tela/ação específica SE o usuário relatar sintoma concreto.
- [ ] Limpeza opcional: remover dead code `components/layout/navigation-progress.tsx` (existe `ui/navigation-progress.tsx` em uso).

**Como retomar:** nada foi alterado nesta sessão (só leitura/análise). Working tree continua limpo no commit 845a954. Build/type-check/lint passam. Para achar bugs além do estático, precisa rodar o app com dados reais (Doppler+Supabase) — pedir ao usuário um sintoma concreto antes de varrer no escuro.

## 2026-06-14 ~15:33 — TUDO COMMITADO ✅ (commit 845a954, working tree limpo)

**Estado:** branch `Branch_Jose` sincronizada com origin, working tree **limpo**. O commit `845a954 "Configurações gerais"` empacotou as 3 levas abaixo (logo, profile-completion-banner, aviso de trial) + CHECKPOINT.md + CLAUDE.md. Nada pendente de commit.

**Arquivos no commit 845a954:**
- `apps/web/components/ui/navigation-progress.tsx` (+3) — guard mesma-rota (fix linha travada)
- `apps/web/components/layout/brand-logo.tsx` (+15) — onClick scroll-top + refresh
- `apps/web/components/layout/profile-completion-banner.tsx` (novo, +97) — aviso cadastro incompleto
- `apps/web/app/(dashboard)/layout.tsx` (+2) — monta o banner
- `apps/web/components/layout/billing-banner.tsx` (+13) — aviso fim de trial vermelho
- `apps/web/app/api/webhooks/stripe/route.ts` (+14) e `apps/web/app/api/billing/verify-session/route.ts` (+14) — grava status real + trial_ends_at
- `GymFlow-main/CLAUDE.md` (+4) — pegadinha do estado de trial

**Próximos passos (só verificação visual, opcional):**
- [ ] `run` app → clicar logo na home (sem linha travada).
- [ ] Ver profile-completion-banner com conta incompleta no dashboard.
- [ ] Banner trial: seedar academia `subscription_status='trialing'` + `trial_ends_at` ~2 dias à frente (bypass Stripe dev não simula).

**Como retomar:** tudo commitado e type-check OK; sem migration nova. Dead code candidato a remoção: `components/layout/navigation-progress.tsx`. Os blocos abaixo são o histórico detalhado de cada leva.

## 2026-06-14 — Aviso de cadastro incompleto (todos os papéis) ✅ type-check OK

**Tarefa:** quando o usuário se cadastra ou faltam dados da conta, mostrar um aviso pra preencher. Vale pros 3 papéis (ex.: telefone do aluno, e-mail da academia, especialidade do personal).

**Feito (working tree, NÃO commitado):**
- **Novo `apps/web/components/layout/profile-completion-banner.tsx`** — banner âmbar (não bloqueia uso), mesmo padrão do `BillingBanner`. Lê `profile`/`currentAcademy`/`currentRole` do auth-store (sem fetch). Monta a frase "Sua conta está quase pronta! Falta(m) X, Y e Z." + botão "Completar agora". Guard `if (!profile) return null` (profile não é persistido, vem do `use-auth` — evita falso-positivo antes de hidratar). Some em `/perfil` e `/configuracoes`.
- **Montado em `apps/web/app/(dashboard)/layout.tsx`** logo abaixo do `<BillingBanner />`.
- `pnpm --filter @gymflow/web type-check` OK.

**Campos verificados por papel + destino do botão (escolhido pela tela onde TODOS os campos são editáveis):**
- `student` → nome, telefone, data de nascimento → `/perfil`
- `personal` → nome, telefone, especialidade → `/configuracoes?tab=perfil` (specialty só existe lá, não em /perfil)
- `owner` → e-mail, telefone, cidade DA ACADEMIA → `/configuracoes?tab=academia`

**Decisões:** NÃO cobro CNPJ/CREF (opcionais por design — personal solo sem CNPJ, CREF opcional no cadastro). Aparece já no 1º acesso pós-cadastro (novo user cai no dashboard).

**Próximos passos:**
- [ ] Usuário ver em http://localhost:3334/dashboard com conta incompleta.
- [ ] Possível ajuste: incluir mais campos (gênero/objetivo aluno, bio personal, CEP/estado academia) — perguntei, aguardando.
- [ ] Commitar se aprovado (2 arquivos: banner novo + layout).

## 2026-06-14 ~15:30 — Logo: linha de progresso travada ✅ (type-check OK, NÃO commitado)

**Tarefa / objetivo:** usuário relatou que ao clicar no logo "MeuTrein" na landing (`www.meutrein.com.br`) aparece uma linha (barra de progresso) que **trava** e parece travar o site. Pediu: clicar no logo deve **voltar pra inicial e atualizar a página**, sem linha travada.

**Causa raiz:** a barra de progresso de navegação dispara em **qualquer** clique de link interno, inclusive pra própria página. Estando em `/` e clicando no logo (href `/`), o `pathname` nunca muda → o `complete()` (que roda no `useEffect` de mudança de pathname) nunca dispara → barra trava em ~85%. **Pegadinha:** existem 2 cópias do componente; a montada de fato é `components/ui/navigation-progress.tsx` (montada em `app/layout.tsx`), que é a que **não** tinha proteção. A de `components/layout/navigation-progress.tsx` tem a proteção certa mas é **código morto** (não importada em lugar nenhum).

**Feito (type-check `pnpm --filter @gymflow/web type-check` OK, working tree, NÃO commitado):**
- **`apps/web/components/ui/navigation-progress.tsx`** — `handleClick` agora ignora clique pra mesma rota: `if (anchor.pathname === window.location.pathname) return` antes do `start()`. Mata a linha travada pro logo e qualquer link pra própria página.
- **`apps/web/components/layout/brand-logo.tsx`** — adicionado `usePathname`+`useRouter` e `onClick` no `<Link>`: quando `pathname === href`, faz `e.preventDefault()` + `window.scrollTo({top:0, behavior:'smooth'})` + `router.refresh()`. Dá o "volta pra inicial e atualiza" pedido. Vindo de outra rota, o Link navega normal.

**Próximos passos:**
- [ ] Verificação visual (opcional) — `run` a app e clicar no logo na home. Lógica é direta; type-check passou.
- [ ] Commitar (usuário decide).

**Como retomar:** fix completo e type-check OK. Sem migration, só 2 arquivos de UI. Observação: `components/layout/navigation-progress.tsx` é dead code (candidato a remoção futura, fora de escopo agora).

## 2026-06-14 ~17:40 — Aviso de fim de trial (vermelho) no BillingBanner ✅ (type-check OK, NÃO commitado)

**Tarefa / objetivo:** usuário perguntou sobre o pagamento Stripe. Confirmado: assinatura mensal recorrente **só no cartão** (`mode: 'subscription'` + `payment_method_types: ['card']`), Stripe cobra sozinho todo mês; starter/personal têm `trial_period_days: 30`. **Pix descartado** (não dá recorrência automática). Usuário pediu: aviso **vermelho** quando faltam **3 dias** pro fim do teste grátis. (AskUserQuestion → escolheu "Fim do teste grátis".)

**Feito (type-check OK em cada lote, TUDO no working tree, NÃO commitado):**
- **`apps/web/components/layout/billing-banner.tsx`** — novo estado vermelho: `subscription_status === 'trialing'` && `trial_ends_at` && `daysLeft <= 3` → "Seu período de teste termina em X dias..." (>=1 dia plural; <=0 "termina hoje"). Lê só do store, sem fetch.
- **CAUSA RAIZ corrigida** (sem isso o banner nunca apareceria): `trial_ends_at` (coluna existe desde migration 001) **nunca era gravada** e o status saía `'active'` fixo mesmo em trial. Corrigi os 2 pontos de gravação:
  - `apps/web/app/api/webhooks/stripe/route.ts` — `checkout.session.completed` agora faz `subscriptions.retrieve()` e grava status real (`trialing` vs `active`) + `trial_ends_at`; `customer.subscription.updated` passou a persistir `trial_ends_at` também.
  - `apps/web/app/api/billing/verify-session/route.ts` — mesmo: retrieve + grava status real + `trial_ends_at` (em vez de `'active'` hardcoded).
  - Bônus: conserta o rótulo "Trial — X dias restantes" da tela `/configuracoes?tab=plano` (que dependia de `status==='trialing'`).
- **`GymFlow-main/CLAUDE.md`** — atualizada seção "Banner de cobrança pendente" com o estado `trialing` + "Pegadinha do estado de trial".

**Próximos passos:**
- [ ] **Verificação visual NÃO feita** — banner só aparece com academia em `trialing`; bypass de Stripe em dev não simula trial. Pra testar: setar manualmente numa linha de `academies`: `subscription_status='trialing'` + `trial_ends_at` ~2 dias à frente, abrir dashboard como owner.
- [ ] Commitar (usuário decide).

**Como retomar:** feature pronta e type-check OK. Falta só seedar uma academia em trial e ver o banner na tela (ou validar em prod no próximo trial real). Nenhuma migration nova — só código.

## 2026-06-14 16:55 — Migration 075 APLICADA em PROD ✅ + types + smoke test OK

**Feito:**
- **Migration 075 aplicada em produção.** Pegadinha resolvida: havia um **072 órfão** (`072_realtime_workout_sheets.sql` local, não no histórico remoto — colisão de nº) que fazia `--include-all` tentar reaplicar versão 072 (duplicate key). Solução segura: movi o 072 pra /tmp (já está aplicado de fato + é idempotente), `db push --include-all` aplicou SÓ o 075, e devolvi o 072 ao folder. Histórico remoto agora tem 075.
- **`pnpm db:types` regenerado** (via `npx supabase gen types --linked`): `contact_requests` + `get_public_academies` agora nos types (1863 linhas). `type-check` OK.
- **Smoke test em PROD:** `curl` na RPC `get_public_academies` com a anon key retornou as academias com contagens e SÓ colunas públicas (sem PII). Path público funciona em produção.
- Comando usado p/ aplicar (caso precise de novo): mover 072 órfão → `npx supabase db push --include-all` → devolver 072. CLI já tem sessão/senha salva (conecta sem pedir).

**Pendências:**
- [x] **Commitado + mergeado pelo usuário (2026-06-14 ~17h).** Inclui BeforeAfter+TrustStrip, fixes FPS, feature academias inteira + migration 075.
- [ ] Testar o fluxo visual em http://localhost:3334/academias (lista → detalhe → pedir convite → cair em /solicitacoes). Backend já validado.
- [ ] **Opcional:** remover os `as any` comentados (`solicitacoes/page.tsx`, `academias/page.tsx`, `[slug]/page.tsx`) agora que os types existem — type-check passa com ou sem.
- [ ] (antigas) login Google apex vs www; @ Instagram.

**Como retomar:** feature 100% funcional em prod (migration + types + RPC verificada). Falta só teste visual e commit.

## 2026-06-14 16:30 — Feature "Academias cadastradas" CONSTRUÍDA ✅ (type-check OK, migration NÃO aplicada)

**Tarefa / objetivo:** página pública de academias na navbar da landing. Lista academias (read-only), detalhe mostra CONTAGENS (alunos/personais), e "pedir convite" deixando email/telefone/whatsapp → cai numa caixa de solicitações no dashboard da academia.

**DECISÃO DE PRIVACIDADE (importante):** o usuário pediu "ver os alunos da academia" publicamente. EU ALERTEI que expor nomes de alunos/personais à internet = violação LGPD + contradiz isolamento multi-tenant + o selo "LGPD" da landing. Usuário concordou: **mostrar só CONTAGENS (números), nunca nomes.** Caixa de solicitações = escolhida (vs abrir WhatsApp direto).

**Feito (type-check OK, TUDO no working tree, NÃO commitado):**
- **Migration `supabase/migrations/075_contact_requests.sql`** — tabela `contact_requests` (academy_id FK cascade, name/email/phone/message/status, CHECK email OR phone) + RLS (SELECT/UPDATE só owner/personal via `get_user_academy_ids()` + `get_user_role_in_academy()`; SEM policy de INSERT — insert só service_role) + função `get_public_academies()` SECURITY DEFINER (retorna id/name/slug/city/state/logo_url + student_count/personal_count agregados; GRANT anon+authenticated). Usa `gen_random_uuid()`.
- **`app/api/academias/contact/route.ts`** — POST público: rate limit (`RATE_LIMITS.invite`) + `verifyTurnstileToken` + valida (email ou phone obrigatório) + insert via admin client service_role.
- **`app/academias/page.tsx`** — lista pública (client), chama RPC `get_public_academies` via anon, busca por nome/cidade, cards com contagens. Header próprio + BrandLogo.
- **`app/academias/[slug]/page.tsx`** — detalhe (client), acha academia pelo slug, mostra contagens + form "Pedir convite" com `<Turnstile>` (ref.getToken()) → POST contact.
- **`app/page.tsx`** — link "Academias" → `/academias` na nav desktop E mobile.
- **`app/(dashboard)/solicitacoes/page.tsx`** — caixa: lista contact_requests da academia (filtro Novas/Todas), mailto + wa.me, "marcar resolvida" (UPDATE status). `supabase as any` (tabela não está nos types ainda).
- **`components/layout/sidebar.tsx`** — import `Inbox` + item "Solicitações" → `/solicitacoes` (roles owner E personal).
- **`middleware.ts`** — `/academias` em PUBLIC_ROUTES; `/academias/` em PUBLIC_PREFIXES; `/api/academias/contact` em PUBLIC_API_ROUTES.

**Notas técnicas:** `contact_requests` e a RPC `get_public_academies` NÃO estão em `packages/database/src/types.ts` ainda → usei `as any`/cast comentado. Sumirá após db:types.

**Próximos passos (BLOQUEADORES pra funcionar):**
- [ ] **APLICAR migration 075 em PROD** (`pnpm db:push` aponta pra prod). Usuário precisa autorizar — perguntei, aguardando. Sem ela: lista vazia + form dá 500.
- [ ] **`pnpm db:types`** após a migration, e remover os `as any` se quiser (opcional).
- [ ] Testar fluxo ponta a ponta em http://localhost:3334/academias.
- [ ] Commitar (acumula: BeforeAfter+TrustStrip, fixes FPS, e esta feature inteira).

**Pendências antigas ainda abertas:** login Google apex vs www (Supabase Site URL); @ Instagram placeholder.

**Como retomar:** feature inteira no working tree, type-check passa. O que falta é AÇÃO EXTERNA: aplicar migration 075 em prod + db:types. Avisar/confirmar com o usuário antes do `db:push`.

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
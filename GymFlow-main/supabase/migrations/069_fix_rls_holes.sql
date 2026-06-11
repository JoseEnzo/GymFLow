-- ============================================================
-- GymFlow — Corrige 3 brechas críticas de RLS (2026-06-11)
-- ============================================================
-- Contexto: RLS é por LINHA, não por coluna — uma policy de SELECT
-- permissiva expõe a linha inteira, e predicados como `token is not
-- null` são tautologias (verdadeiros pra toda linha), não filtros.
-- ============================================================

-- ── 1) academy_members INSERT ───────────────────────────────────────────────
-- O branch `OR auth.uid() = user_id` (migration 025) permitia qualquer usuário
-- autenticado se inserir em QUALQUER academia com QUALQUER role — inclusive
-- 'owner', dando acesso total ao tenant. Era resquício do aceite de convite
-- client-side (migration 014), substituído pela RPC accept_invite
-- (migration 030, service_role). Fluxos legítimos que inserem membros:
--   * aceite de convite  → RPC accept_invite (service_role, bypassa RLS)
--   * criação de academia → /api/academy (service_role, bypassa RLS)
-- Nenhum fluxo insere com a anon key — o branch pode sair sem quebrar nada.
DROP POLICY IF EXISTS "Inserção de membros" ON public.academy_members;
CREATE POLICY "Inserção de membros" ON public.academy_members
  FOR INSERT WITH CHECK (
    get_user_role_in_academy(academy_id) = ANY (ARRAY['owner'::member_role, 'personal'::member_role])
  );

-- ── 2) invites SELECT ───────────────────────────────────────────────────────
-- `OR token is not null` (migration 002) é tautologia: toda linha tem token,
-- então a tabela inteira (tokens, códigos, e-mails de convidados) era legível
-- por qualquer um, inclusive anônimos. A migration 025 dropou a OUTRA policy
-- `using (true)` acreditando que esta era restritiva — não era.
-- Lookup público (página /codigo, /convite/[token], onboarding) agora passa
-- exclusivamente por /api/invites/lookup (service_role). Aluno não gerencia
-- convites, então o SELECT fica restrito a owner/personal da academia.
DROP POLICY IF EXISTS "Membros vêem convites da academia" ON public.invites;
CREATE POLICY "Membros vêem convites da academia" ON public.invites
  FOR SELECT USING (
    get_user_role_in_academy(academy_id) = ANY (ARRAY['owner'::member_role, 'personal'::member_role])
  );

-- ── 3) academies SELECT público ─────────────────────────────────────────────
-- A migration 013 liberava SELECT em academies com convite ativo dizendo
-- "expõe apenas nome e slug" — mas RLS expõe a LINHA inteira (cnpj, endereço,
-- contato, stripe_customer_id). A página /convite/[token] obtém nome/slug via
-- /api/invites/lookup (service_role), então a policy pode sair.
DROP POLICY IF EXISTS "Academia visível para quem tem convite ativo" ON public.academies;

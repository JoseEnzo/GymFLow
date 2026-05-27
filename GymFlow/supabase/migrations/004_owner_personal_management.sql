-- ============================================================
-- GymFlow — Gerenciamento de personais pelo owner
-- ============================================================
-- Garante que:
-- 1. Owner pode revogar (desativar) qualquer convite da sua academia
-- 2. Owner pode desativar membros com role='personal'
-- 3. A política existente já cobre o INSERT de convites pelo owner,
--    mas vamos garantir o UPDATE (revogação) de forma explícita.
-- ============================================================

-- ── Convites: owner pode desativar ───────────────────────────
-- A política existente "Owner e personal gerenciam convites" já cobre
-- UPDATE, mas inclui `auth.role() = 'service_role'` como OR, o que é
-- correto. Adicionamos uma política específica para clareza e segurança:

-- Remover política antiga se existir (idempotente)
drop policy if exists "Owner revoga convites da academia" on invites;

create policy "Owner revoga convites da academia"
  on invites for update
  using (
    get_user_role_in_academy(academy_id) = 'owner'
  )
  with check (
    get_user_role_in_academy(academy_id) = 'owner'
  );

-- ── academy_members: owner pode desativar personais ──────────
-- A política "Owner desativa membros" já existe no 002_rls_policies.sql
-- e cobre: get_user_role_in_academy(academy_id) = 'owner' OR user_id = auth.uid()
-- Não é necessário adicionar outra, mas garantimos que o índice de role
-- está eficiente para queries do painel de personais:

-- Índice adicional para consultas na página de personais
create index if not exists idx_members_role_active
  on academy_members(academy_id, role, is_active);

-- Índice para convites por role (página lista convites de personais)
create index if not exists idx_invites_role
  on invites(academy_id, role, is_active);

-- ── Função auxiliar: verificar se usuário pode gerenciar personais ──
create or replace function can_manage_personals(p_academy_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from academy_members
    where user_id = auth.uid()
      and academy_id = p_academy_id
      and role = 'owner'
      and is_active = true
  );
$$;

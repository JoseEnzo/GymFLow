-- ============================================================
-- GymFlow — Restrição de role em convites criados por personais
-- ============================================================
-- Regra de negócio:
--   owner  → pode criar convites de qualquer role (personal, student)
--   personal → pode criar apenas convites de role = 'student'
-- ============================================================

-- Remove a política permissiva atual
drop policy if exists "Owner e personal criam convites" on invites;

-- Política para owner: cria qualquer role
create policy "Owner cria convites"
  on invites for insert
  with check (
    get_user_role_in_academy(academy_id) = 'owner'
  );

-- Política para personal: apenas role = 'student'
create policy "Personal cria convites de aluno"
  on invites for insert
  with check (
    get_user_role_in_academy(academy_id) = 'personal'
    and role = 'student'
  );

-- ============================================================
-- GymFlow — Owner pode REMOVER membros (DELETE) da academia
-- ============================================================
-- Antes só existia UPDATE (soft delete via is_active). "Remover"
-- aluno/personal agora apaga o vínculo academy_members de fato.
-- Conta/perfil/fichas do usuário são preservados — some apenas o
-- vínculo com a academia. Owners não podem ser removidos.
-- expulsion_requests.student_member_id é ON DELETE CASCADE, então
-- pedidos pendentes do membro removido somem junto.
-- ============================================================

drop policy if exists "Owner remove membros" on academy_members;

create policy "Owner remove membros"
  on academy_members for delete
  using (
    get_user_role_in_academy(academy_id) = 'owner'::member_role
    and role <> 'owner'::member_role
  );

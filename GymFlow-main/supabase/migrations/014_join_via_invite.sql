-- ============================================================
-- GymFlow — Permite que usuário entre em academia via convite
-- ============================================================
-- Problema: a policy de INSERT em academy_members exige que o
-- usuário já seja owner ou personal da academia. Quem chega via
-- convite ainda não é membro, então o upsert falha com RLS.
--
-- Solução: adicionar policy que libera INSERT quando:
--   1. O user_id inserido é o próprio usuário autenticado
--   2. Existe convite ativo para aquela academia com a mesma role
--   3. O convite não está expirado e ainda tem usos disponíveis
-- ============================================================

drop policy if exists "Usuário entra via convite" on academy_members;

create policy "Usuário entra via convite"
  on academy_members for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from invites
      where invites.academy_id = academy_members.academy_id
        and invites.role       = academy_members.role
        and invites.is_active  = true
        and (invites.expires_at is null or invites.expires_at > now())
        and (invites.uses_limit is null or invites.uses_count < invites.uses_limit)
    )
  );

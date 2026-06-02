-- ============================================================
-- GymFlow — Permite leitura pública de academia via convite ativo
-- ============================================================
-- Problema: usuários anônimos (não logados) que abrem um link de
-- convite (/convite/[token]) não conseguem ver a academia porque
-- a policy existente exige que o usuário já seja membro.
--
-- Solução: liberar SELECT na academia quando existe ao menos um
-- convite ativo vinculado a ela. Isso expõe apenas nome e slug
-- (o que a página de convite precisa) sem abrir dados sensíveis.
-- ============================================================

drop policy if exists "Academia visível para quem tem convite ativo" on academies;

create policy "Academia visível para quem tem convite ativo"
  on academies for select using (
    exists (
      select 1 from invites
      where invites.academy_id = academies.id
        and invites.is_active = true
    )
  );

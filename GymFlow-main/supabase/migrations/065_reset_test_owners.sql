-- ============================================================
-- RESET TOTAL de contas de teste — usuário autorizou 2026-06-08.
-- Ordem importa: academies.owner_id é ON DELETE RESTRICT, então
-- delete academies ANTES de auth.users.
-- Cascata: academies → academy_members, meal_plans, workout_sheets,
-- workout_logs, set_logs, recipes(academy_id), invites, etc.
-- ============================================================

-- 1) Identifica owners de teste (todos com account_type='owner')
--    e deleta as academies deles primeiro.
delete from academies
where owner_id in (
  select id from auth.users
  where raw_user_meta_data->>'account_type' = 'owner'
);

-- 2) Limpa academy_members residuais (members convidados em academies
--    que não existem mais — ON DELETE CASCADE já deve ter feito isso
--    mas garante).
delete from academy_members
where academy_id not in (select id from academies);

-- 3) Agora deleta auth.users dos owners (sem academias bloqueando).
delete from auth.users
where raw_user_meta_data->>'account_type' = 'owner';

-- 4) Sanity check via NOTICE
do $$
declare
  n_owners int; n_academies int; n_members int;
begin
  select count(*) into n_owners from auth.users where raw_user_meta_data->>'account_type' = 'owner';
  select count(*) into n_academies from academies;
  select count(*) into n_members from academy_members;
  raise notice '=== RESET COMPLETO: owners=% academies=% members=% ===',
    n_owners, n_academies, n_members;
end $$;

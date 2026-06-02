-- Garante que todo owner de academia tenha uma linha em academy_members.
-- Corrige contas criadas antes desta migration.
insert into academy_members (academy_id, user_id, role, joined_at)
select
  a.id           as academy_id,
  a.owner_id     as user_id,
  'owner'        as role,
  a.created_at   as joined_at
from academies a
where not exists (
  select 1 from academy_members m
  where m.academy_id = a.id
    and m.user_id    = a.owner_id
)
on conflict (academy_id, user_id) do nothing;

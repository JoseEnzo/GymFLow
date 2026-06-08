-- DIAG: estado atual de auth.users (owners) + academies
do $$
declare
  r record;
begin
  raise notice '=== AUTH.USERS owner (últimos 20) ===';
  for r in
    select
      u.id,
      u.email,
      u.created_at,
      u.email_confirmed_at,
      u.raw_user_meta_data->>'document' as doc,
      (select count(*) from academies a where a.owner_id = u.id) as n_academies,
      (select count(*) from academy_members am where am.user_id = u.id) as n_members
    from auth.users u
    where u.raw_user_meta_data->>'account_type' = 'owner'
    order by u.created_at desc
    limit 20
  loop
    raise notice 'user=% | email=% | doc=% | academies=% | members=% | created=%',
      r.id, r.email, r.doc, r.n_academies, r.n_members, r.created_at;
  end loop;

  raise notice '=== ACADEMIES (últimas 10) ===';
  for r in
    select id, name, cnpj, owner_id, created_at from academies order by created_at desc limit 10
  loop
    raise notice 'id=% | name=% | cnpj=% | owner=% | created=%',
      r.id, r.name, r.cnpj, r.owner_id, r.created_at;
  end loop;
end $$;

-- DIAG: cruza auth.users (owners) com academies pra ver órfãos
do $$
declare
  r record;
  total_owners int := 0;
  owners_with_academy int := 0;
  owners_orphan int := 0;
begin
  raise notice '=== owners no auth.users vs academies ===';
  for r in
    select
      u.id,
      u.email,
      u.created_at,
      u.email_confirmed_at,
      u.raw_user_meta_data->>'document' as doc,
      (select count(*) from academies a where a.owner_id = u.id) as n_academies
    from auth.users u
    where u.raw_user_meta_data->>'account_type' = 'owner'
    order by u.created_at desc
    limit 20
  loop
    total_owners := total_owners + 1;
    if r.n_academies > 0 then owners_with_academy := owners_with_academy + 1;
    else owners_orphan := owners_orphan + 1;
    end if;
    raise notice 'user=% email=% confirmed=% doc=% n_academies=% created=%',
      r.id, r.email,
      case when r.email_confirmed_at is null then 'NÃO' else 'sim' end,
      r.doc, r.n_academies, r.created_at;
  end loop;

  raise notice '=== resumo: total=% com_academia=% órfãos=% ===',
    total_owners, owners_with_academy, owners_orphan;
end $$;

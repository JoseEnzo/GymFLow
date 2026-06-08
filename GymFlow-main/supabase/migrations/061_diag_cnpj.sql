-- DIAGNÓSTICO TEMPORÁRIO: dump de cnpj duplicado e últimas academias
-- Pode ser removido depois — não altera nada.

do $$
declare
  r record;
  total int;
  with_cnpj int;
begin
  select count(*) into total from academies;
  select count(*) into with_cnpj from academies where cnpj is not null;
  raise notice '=== academies: total=%, com cnpj=% ===', total, with_cnpj;

  for r in
    select cnpj, count(*) as n
      from academies
     where cnpj is not null
     group by cnpj
    having count(*) > 1
  loop
    raise notice 'DUPLICATE cnpj=% (n=%)', r.cnpj, r.n;
  end loop;

  raise notice '=== ultimas 10 academias com cnpj ===';
  for r in
    select cnpj, name, owner_id, created_at
      from academies
     where cnpj is not null
     order by created_at desc
     limit 10
  loop
    raise notice 'cnpj=% | name=% | owner=% | at=%', r.cnpj, r.name, r.owner_id, r.created_at;
  end loop;
end $$;

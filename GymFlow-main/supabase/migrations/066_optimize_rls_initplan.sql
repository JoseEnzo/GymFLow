-- ============================================================
-- 066 — Otimização de RLS: envolver auth.uid()/auth.role()/get_user_academy_ids()
--       em subquery escalar (select ...) para avaliação única por query.
-- ============================================================
--
-- PROBLEMA: quando uma policy chama `auth.uid()` diretamente, o planner do
-- Postgres reavalia a função POR LINHA varrida. Em tabelas grandes
-- (workout_logs, set_logs, body_measurements) sob concorrência isso domina
-- a CPU do banco — exatamente o recurso que satura com muitos usuários ativos.
--
-- CORREÇÃO: `(select auth.uid())` é uma subquery escalar sem correlação com a
-- linha. O planner a avalia UMA vez (InitPlan) e reusa o resultado em toda a
-- varredura. Ganho típico de 10-100x+ em tabelas grandes. Recomendação oficial:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- ESCOPO: só funções ESCALARES sem argumento (auth.uid, auth.role).
--   - get_user_academy_ids() retorna uuid[] e é usada como `= any(fn())`.
--     Envolvê-la viraria `= any((select fn()))`, que o Postgres lê como a forma
--     "subquery" de ANY e tenta `uuid = uuid[]` → erro. Fica como está (já é
--     STABLE, então é avaliada uma vez por query mesmo sem o wrap).
--   - get_user_role_in_academy(academy_id) recebe argumento de coluna, varia por
--     linha e NÃO seria içada para InitPlan. Fica como está.
--
-- O bloco reconstrói cada policy a partir do catálogo (pg_policies = fonte da
-- verdade) e aplica ALTER POLICY, preservando nome/comando/roles/permissive.
-- A normalização usa regexp_replace que casa tanto a forma JÁ envolta quanto a
-- crua e produz sempre a forma envolta — idempotente e seguro contra
-- qualificação opcional de schema (ex: public.get_user_academy_ids()).

do $$
declare
  pol       record;
  -- Cada entrada é o regex (ARE) que casa a CHAMADA da função. auth.* é sempre
  -- qualificado (auth não está no search_path). Só funções escalares — ver nota
  -- de ESCOPO no topo sobre por que get_user_academy_ids() fica de fora.
  call_res  text[] := array[
    'auth\.uid\(\)',
    'auth\.role\(\)'
  ];
  call_re   text;
  pattern   text;
  new_qual  text;
  new_check text;
  stmt      text;
begin
  for pol in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    new_qual  := pol.qual;
    new_check := pol.with_check;

    foreach call_re in array call_res loop
      -- Alt 1: forma já envolta `( SELECT <call> [AS alias])` → recaptura só a
      --        chamada e normaliza, descartando o alias que o Postgres injeta ao
      --        re-renderizar a subquery (torna a transformação idempotente).
      -- Alt 2: chamada crua → captura e envolve. Só um dos grupos casa por vez;
      --        o grupo não-casado vira string vazia em \1\2, então a saída é a mesma.
      pattern := '\(\s*select\s+(' || call_re || ')(?:\s+as\s+\w+)?\s*\)|(' || call_re || ')';

      if new_qual is not null then
        new_qual := regexp_replace(new_qual, pattern, '(select \1\2)', 'gi');
      end if;
      if new_check is not null then
        new_check := regexp_replace(new_check, pattern, '(select \1\2)', 'gi');
      end if;
    end loop;

    if (new_qual is distinct from pol.qual) or (new_check is distinct from pol.with_check) then
      stmt := format('alter policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
      if new_qual is not null then
        stmt := stmt || format(' using (%s)', new_qual);
      end if;
      if new_check is not null then
        stmt := stmt || format(' with check (%s)', new_check);
      end if;
      execute stmt;
      raise notice 'RLS otimizada: %.% / %', pol.schemaname, pol.tablename, pol.policyname;
    end if;
  end loop;
end $$;

-- Recarrega o schema cache do PostgREST.
notify pgrst, 'reload schema';

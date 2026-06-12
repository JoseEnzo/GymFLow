-- ============================================================
-- GymFlow — RPCs get_frequency_stats + get_academy_reports
-- Substitui as queries unbounded de /frequencia (3) e /relatorios (6)
-- que baixavam TODO o histórico de workout_logs pra contar no cliente
-- (e eram truncadas silenciosamente em 1000 linhas pelo db.max_rows
-- do PostgREST — total e best streak ficavam errados).
-- Agregação (counts, streak, heatmap por dia) passa pro banco;
-- payload cai de O(historico) pra O(365).
-- SECURITY INVOKER + permission check explícito (padrão 056-059).
-- p_tz = IANA timezone do browser, pra dia local ≠ dia UTC.
-- ============================================================

-- ─── /frequencia (aluno: próprios logs | owner/personal: academia) ───

create or replace function public.get_frequency_stats(
  p_academy_id  uuid,
  p_student_id  uuid,         -- null → visão academia (exige owner/personal)
  p_week_start  timestamptz,
  p_month_start timestamptz,
  p_year_ago    timestamptz,  -- janela do heatmap
  p_tz          text
) returns jsonb
language plpgsql
security invoker
stable
as $$
declare
  v_tz          text := coalesce(nullif(p_tz, ''), 'UTC');
  v_total       int;
  v_week        int;
  v_month       int;
  v_best_streak int;
  v_week_dows   jsonb;
  v_log_days    jsonb;
begin
  -- Auth check
  if p_student_id is null then
    if not exists (
      select 1 from academy_members
       where academy_id = p_academy_id
         and user_id = auth.uid()
         and role in ('owner', 'personal')
         and is_active
    ) then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
  elsif p_student_id <> auth.uid() then
    raise exception 'AUTH_MISMATCH' using errcode = '42501';
  end if;

  -- Contagens (COUNT no banco, nada de baixar linhas)
  select count(*) into v_total
    from workout_logs
   where academy_id = p_academy_id
     and (p_student_id is null or student_id = p_student_id);

  select count(*) into v_week
    from workout_logs
   where academy_id = p_academy_id
     and (p_student_id is null or student_id = p_student_id)
     and created_at >= p_week_start;

  select count(*) into v_month
    from workout_logs
   where academy_id = p_academy_id
     and (p_student_id is null or student_id = p_student_id)
     and created_at >= p_month_start;

  -- Best streak (dias locais consecutivos) — gaps-and-islands
  with d as (
    select distinct (created_at at time zone v_tz)::date as day
      from workout_logs
     where academy_id = p_academy_id
       and (p_student_id is null or student_id = p_student_id)
  ),
  g as (
    select day, day - (row_number() over (order by day))::int as grp
      from d
  )
  select coalesce(max(cnt), 0) into v_best_streak
    from (select count(*) as cnt from g group by grp) s;

  -- Dias da semana atual com treino (0=dom … 6=sáb, tz local)
  select coalesce(jsonb_agg(distinct extract(dow from created_at at time zone v_tz)::int), '[]'::jsonb)
    into v_week_dows
    from workout_logs
   where academy_id = p_academy_id
     and (p_student_id is null or student_id = p_student_id)
     and created_at >= p_week_start;

  -- Heatmap: count por dia local no último ano (≤366 entradas)
  select coalesce(jsonb_agg(jsonb_build_object('d', t.day, 'c', t.cnt) order by t.day), '[]'::jsonb)
    into v_log_days
    from (
      select (created_at at time zone v_tz)::date as day, count(*)::int as cnt
        from workout_logs
       where academy_id = p_academy_id
         and (p_student_id is null or student_id = p_student_id)
         and created_at >= p_year_ago
       group by 1
    ) t;

  return jsonb_build_object(
    'total_count', v_total,
    'week_count',  v_week,
    'month_count', v_month,
    'best_streak', v_best_streak,
    'week_dows',   v_week_dows,
    'log_days',    v_log_days
  );
end;
$$;

comment on function public.get_frequency_stats is
  'Agrega métricas de /frequencia em 1 roundtrip (counts + streak + heatmap por dia local). SECURITY INVOKER; p_student_id null exige owner/personal, senão precisa ser auth.uid(). Substitui 3 queries unbounded.';

grant execute on function public.get_frequency_stats(uuid, uuid, timestamptz, timestamptz, timestamptz, text) to authenticated;

-- ─── /relatorios (owner/personal) ───

create or replace function public.get_academy_reports(
  p_academy_id      uuid,
  p_week_start      timestamptz,
  p_prev_week_start timestamptz,
  p_month_start     timestamptz,
  p_year_ago        timestamptz,
  p_tz              text
) returns jsonb
language plpgsql
security invoker
stable
as $$
declare
  v_tz              text := coalesce(nullif(p_tz, ''), 'UTC');
  v_week            int;
  v_prev_week       int;
  v_month           int;
  v_total           int;
  v_best_streak     int;
  v_active_students int;
  v_active_members  int;
  v_new_sheets      int;
  v_by_day          jsonb;
  v_top_students    jsonb;
  v_log_days        jsonb;
begin
  -- Auth check
  if not exists (
    select 1 from academy_members
     where academy_id = p_academy_id
       and user_id = auth.uid()
       and role in ('owner', 'personal')
       and is_active
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- Contagens
  select count(*) into v_week
    from workout_logs
   where academy_id = p_academy_id and created_at >= p_week_start;

  select count(*) into v_prev_week
    from workout_logs
   where academy_id = p_academy_id
     and created_at >= p_prev_week_start
     and created_at <  p_week_start;

  select count(*) into v_month
    from workout_logs
   where academy_id = p_academy_id and created_at >= p_month_start;

  select count(*) into v_total
    from workout_logs
   where academy_id = p_academy_id;

  select count(distinct student_id) into v_active_students
    from workout_logs
   where academy_id = p_academy_id and created_at >= p_week_start;

  select count(*) into v_active_members
    from academy_members
   where academy_id = p_academy_id and role = 'student' and is_active;

  select count(*) into v_new_sheets
    from workout_sheets
   where academy_id = p_academy_id and created_at >= p_month_start;

  -- Best streak da academia (dias locais consecutivos com >=1 treino)
  with d as (
    select distinct (created_at at time zone v_tz)::date as day
      from workout_logs
     where academy_id = p_academy_id
  ),
  g as (
    select day, day - (row_number() over (order by day))::int as grp
      from d
  )
  select coalesce(max(cnt), 0) into v_best_streak
    from (select count(*) as cnt from g group by grp) s;

  -- Treinos por dia da semana atual — array fixo de 7 posições (0=dom)
  select jsonb_agg(coalesce(c.cnt, 0) order by g.dow)
    into v_by_day
    from generate_series(0, 6) as g(dow)
    left join (
      select extract(dow from created_at at time zone v_tz)::int as dow, count(*)::int as cnt
        from workout_logs
       where academy_id = p_academy_id and created_at >= p_week_start
       group by 1
    ) c on c.dow = g.dow;

  -- Top 5 alunos da semana (nome já resolvido — elimina a query de profiles)
  select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'count', t.cnt) order by t.cnt desc), '[]'::jsonb)
    into v_top_students
    from (
      select student_id, count(*)::int as cnt
        from workout_logs
       where academy_id = p_academy_id and created_at >= p_week_start
       group by student_id
       order by cnt desc
       limit 5
    ) t
    left join profiles p on p.id = t.student_id;

  -- Heatmap: count por dia local no último ano (≤366 entradas)
  select coalesce(jsonb_agg(jsonb_build_object('d', t.day, 'c', t.cnt) order by t.day), '[]'::jsonb)
    into v_log_days
    from (
      select (created_at at time zone v_tz)::date as day, count(*)::int as cnt
        from workout_logs
       where academy_id = p_academy_id and created_at >= p_year_ago
       group by 1
    ) t;

  return jsonb_build_object(
    'week_count',           v_week,
    'prev_week_count',      v_prev_week,
    'month_count',          v_month,
    'total_count',          v_total,
    'best_streak',          v_best_streak,
    'active_students',      v_active_students,
    'total_active_members', v_active_members,
    'new_sheets',           v_new_sheets,
    'workouts_by_day',      v_by_day,
    'top_students',         v_top_students,
    'log_days',             v_log_days
  );
end;
$$;

comment on function public.get_academy_reports is
  'Agrega métricas de /relatorios em 1 roundtrip (counts, streak, top alunos, heatmap por dia local). SECURITY INVOKER + check owner/personal. Substitui 6 queries (2 unbounded) + 1 query de profiles.';

grant execute on function public.get_academy_reports(uuid, timestamptz, timestamptz, timestamptz, timestamptz, text) to authenticated;

-- ============================================================
-- GymFlow — RPC get_student_dashboard
-- Substitui as ~9 queries do student dashboard por 1 roundtrip.
-- SECURITY INVOKER + check p_student_id = auth.uid().
-- p_today_date passada explícita pra evitar timezone drift na
-- comparação com agenda_completions.completed_on (date).
-- ============================================================

create or replace function public.get_student_dashboard(
  p_academy_id   uuid,
  p_student_id   uuid,
  p_week_ago     timestamptz,
  p_today_start  timestamptz,
  p_today_date   date,
  p_today_index  smallint   -- 0 (dom) … 6 (sáb)
) returns jsonb
language plpgsql
security invoker
stable
as $$
declare
  v_total_workouts     int;
  v_week_workouts      int;
  v_active_sheets      int;
  v_free_logged_today  int;
  v_log_dates          jsonb;
  v_last_workout       jsonb;
  v_today_workout      jsonb;
  v_next_workout       jsonb;
  v_today_sheet_id     uuid;
begin
  -- Auth check
  if p_student_id <> auth.uid() then
    raise exception 'AUTH_MISMATCH' using errcode = '42501';
  end if;

  -- Contagens
  select count(*) into v_total_workouts
    from workout_logs
   where student_id = p_student_id and academy_id = p_academy_id;

  select count(*) into v_week_workouts
    from workout_logs
   where student_id = p_student_id
     and academy_id = p_academy_id
     and created_at >= p_week_ago;

  select count(*) into v_active_sheets
    from workout_sheets
   where student_id = p_student_id
     and academy_id = p_academy_id
     and is_active;

  -- Treino livre logado hoje (sheet_id null → registrado manualmente)
  select count(*) into v_free_logged_today
    from workout_logs
   where student_id = p_student_id
     and academy_id = p_academy_id
     and sheet_id is null
     and created_at >= p_today_start;

  -- Todas as datas de log (cliente computa streak/heatmap/monthly localmente)
  select coalesce(jsonb_agg(created_at), '[]'::jsonb)
    into v_log_dates
    from workout_logs
   where student_id = p_student_id and academy_id = p_academy_id;

  -- Último treino + nome da ficha
  select to_jsonb(t) into v_last_workout
  from (
    select wl.id, wl.created_at, wl.duration_seconds, wl.sheet_id, ws.name as sheet_name
      from workout_logs wl
      left join workout_sheets ws on ws.id = wl.sheet_id
     where wl.student_id = p_student_id and wl.academy_id = p_academy_id
     order by wl.created_at desc
     limit 1
  ) t;

  -- Treino de hoje (se houver ficha ativa com scheduled_days contendo today_index)
  select ws.id into v_today_sheet_id
    from workout_sheets ws
   where ws.student_id = p_student_id
     and ws.academy_id = p_academy_id
     and ws.is_active
     and p_today_index = any(ws.scheduled_days)
   limit 1;

  if v_today_sheet_id is not null then
    select jsonb_build_object(
      'id',             ws.id,
      'name',           ws.name,
      'goal',           ws.goal,
      'exercise_count', (select count(*) from sheet_exercises se where se.sheet_id = ws.id),
      'already_done',   exists (
        select 1 from agenda_completions ac
         where ac.sheet_id = ws.id
           and ac.student_id = p_student_id
           and ac.completed_on = p_today_date
      )
    ) into v_today_workout
    from workout_sheets ws
   where ws.id = v_today_sheet_id;
  end if;

  -- Próximo treino (se não há ficha hoje) — primeiro dia futuro com ficha
  if v_today_workout is null then
    with sheets as (
      select ws.id, ws.name, ws.goal, ws.scheduled_days,
             (select count(*) from sheet_exercises se where se.sheet_id = ws.id) as exercise_count
        from workout_sheets ws
       where ws.student_id = p_student_id
         and ws.academy_id = p_academy_id
         and ws.is_active
    ),
    next_days as (
      select s.id, s.name, s.goal, s.exercise_count, d.day,
             ((d.day - p_today_index + 7) % 7) as days_from_today
        from sheets s
        cross join lateral unnest(s.scheduled_days) as d(day)
       where d.day <> p_today_index
    )
    select jsonb_build_object(
      'id',             id,
      'name',           name,
      'goal',           goal,
      'exercise_count', exercise_count,
      'scheduled_day',  day
    ) into v_next_workout
    from next_days
    order by days_from_today
    limit 1;
  end if;

  return jsonb_build_object(
    'total_workouts',    v_total_workouts,
    'week_workouts',     v_week_workouts,
    'active_sheets',     v_active_sheets,
    'free_logged_today', v_free_logged_today > 0,
    'log_dates',         v_log_dates,
    'last_workout',      v_last_workout,
    'today_workout',     v_today_workout,
    'next_workout',      v_next_workout
  );
end;
$$;

comment on function public.get_student_dashboard is
  'Agrega métricas do dashboard do aluno em 1 roundtrip. SECURITY INVOKER + check p_student_id = auth.uid(). Substitui ~9 queries Supabase.';

grant execute on function public.get_student_dashboard(uuid, uuid, timestamptz, timestamptz, date, smallint) to authenticated;

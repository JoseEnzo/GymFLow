-- ============================================================
-- GymFlow — RPC get_personal_dashboard
-- Substitui as 7 queries do personal dashboard por 1 roundtrip.
-- SECURITY INVOKER + check de role 'personal' ou 'owner' +
-- enforcement de p_personal_id = auth.uid().
-- ============================================================

create or replace function public.get_personal_dashboard(
  p_academy_id   uuid,
  p_personal_id  uuid,
  p_week_ago     timestamptz,
  p_today_start  timestamptz
) returns jsonb
language plpgsql
security invoker
stable
as $$
declare
  v_role                  text;
  v_my_students           uuid[];
  v_my_students_count     int;
  v_trained_today_count   int;
  v_active_sheets_count   int;
  v_inactive_count        int;
  v_my_students_arr       jsonb;
  v_recent_workouts       jsonb;
begin
  -- Auth check: o personal só pode pedir os dados dele.
  if p_personal_id <> auth.uid() then
    raise exception 'AUTH_MISMATCH' using errcode = '42501';
  end if;
  v_role := public.get_user_role_in_academy(p_academy_id);
  if v_role is null or v_role not in ('personal', 'owner') then
    raise exception 'PERSONAL_OR_OWNER_ONLY' using errcode = '42501';
  end if;

  -- Meus alunos = ativos da academia que eu convidei
  select coalesce(array_agg(distinct user_id), '{}'::uuid[])
    into v_my_students
    from academy_members
   where academy_id = p_academy_id
     and role = 'student'
     and is_active
     and invited_by = p_personal_id;

  v_my_students_count := cardinality(v_my_students);

  -- Sem alunos → resposta vazia
  if v_my_students_count = 0 then
    return jsonb_build_object(
      'my_students_count',   0,
      'trained_today_count', 0,
      'active_sheets_count', 0,
      'inactive_count',      0,
      'my_students',         '[]'::jsonb,
      'recent_workouts',     '[]'::jsonb
    );
  end if;

  -- Trained today (alunos únicos que treinaram hoje)
  select count(distinct student_id) into v_trained_today_count
    from workout_logs
   where academy_id = p_academy_id
     and student_id = any(v_my_students)
     and created_at >= p_today_start;

  -- Alunos com pelo menos 1 ficha ativa
  select count(distinct student_id) into v_active_sheets_count
    from workout_sheets
   where academy_id = p_academy_id
     and student_id = any(v_my_students)
     and is_active;

  -- Inativos = sem treino nos últimos 7d
  select count(*) into v_inactive_count
  from unnest(v_my_students) as s(user_id)
  where not exists (
    select 1 from workout_logs wl
     where wl.academy_id = p_academy_id
       and wl.student_id = s.user_id
       and wl.created_at >= p_week_ago
  );

  -- Lista de alunos com último treino, status hoje e flag de ficha ativa
  with my_last_logs as (
    select distinct on (student_id) student_id, created_at
      from workout_logs
     where academy_id = p_academy_id
       and student_id = any(v_my_students)
       and created_at >= p_week_ago
     order by student_id, created_at desc
  ),
  trained_today as (
    select distinct student_id
      from workout_logs
     where academy_id = p_academy_id
       and student_id = any(v_my_students)
       and created_at >= p_today_start
  ),
  active_sheets as (
    select distinct student_id
      from workout_sheets
     where academy_id = p_academy_id
       and student_id = any(v_my_students)
       and is_active
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id',         s.user_id,
    'full_name',       p.full_name,
    'last_workout_at', mll.created_at,
    'active_sheets',   case when act.student_id is not null then 1 else 0 end,
    'trained_today',   td.student_id is not null
  )), '[]'::jsonb)
  into v_my_students_arr
  from unnest(v_my_students) as s(user_id)
  left join profiles      p   on p.id          = s.user_id
  left join my_last_logs  mll on mll.student_id = s.user_id
  left join trained_today td  on td.student_id  = s.user_id
  left join active_sheets act on act.student_id = s.user_id;

  -- Últimos 8 treinos dos meus alunos
  with recent as (
    select id, created_at, student_id, sheet_id, duration_seconds
      from workout_logs
     where academy_id = p_academy_id
       and student_id = any(v_my_students)
     order by created_at desc
     limit 8
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',               r.id,
    'created_at',       r.created_at,
    'student_id',       r.student_id,
    'student_name',     p.full_name,
    'sheet_id',         r.sheet_id,
    'sheet_name',       ws.name,
    'duration_seconds', r.duration_seconds
  ) order by r.created_at desc), '[]'::jsonb)
  into v_recent_workouts
  from recent r
  left join profiles       p  on p.id  = r.student_id
  left join workout_sheets ws on ws.id = r.sheet_id;

  return jsonb_build_object(
    'my_students_count',   v_my_students_count,
    'trained_today_count', v_trained_today_count,
    'active_sheets_count', v_active_sheets_count,
    'inactive_count',      v_inactive_count,
    'my_students',         v_my_students_arr,
    'recent_workouts',     v_recent_workouts
  );
end;
$$;

comment on function public.get_personal_dashboard is
  'Agrega métricas do dashboard do personal em 1 roundtrip. SECURITY INVOKER + check (p_personal_id = auth.uid() AND role in personal/owner). Substitui ~7 queries Supabase.';

grant execute on function public.get_personal_dashboard(uuid, uuid, timestamptz, timestamptz) to authenticated;

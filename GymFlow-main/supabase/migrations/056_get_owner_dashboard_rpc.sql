-- ============================================================
-- GymFlow — RPC get_owner_dashboard
-- Substitui as 14 queries do owner dashboard por 1 roundtrip.
-- SECURITY INVOKER + permission check explícito (só owner).
-- RLS continua valendo — o INVOKER significa que a função
-- roda com permissões do caller, não escala privilégio.
-- ============================================================

create or replace function public.get_owner_dashboard(
  p_academy_id     uuid,
  p_week_ago       timestamptz,
  p_two_weeks_ago  timestamptz,
  p_month_ago      timestamptz
) returns jsonb
language plpgsql
security invoker
stable
as $$
declare
  v_role                      text;
  v_total_students            int;
  v_active_personals          int;
  v_workouts_this_week        int;
  v_workouts_last_week        int;
  v_new_this_month            int;
  v_active_student_ids        uuid[];
  v_active_this_week          int;
  v_students_without_sheets   int;
  v_recent_students           jsonb;
  v_recent_workouts           jsonb;
  v_inactive_students         jsonb;
  v_personais_perf            jsonb;
begin
  -- Permission check: só owner do tenant pode chamar.
  v_role := public.get_user_role_in_academy(p_academy_id);
  if v_role is null or v_role <> 'owner' then
    raise exception 'OWNER_ONLY' using errcode = '42501';
  end if;

  -- ── Contagens simples ──────────────────────────────────────
  select count(*) into v_total_students
    from academy_members
   where academy_id = p_academy_id and role = 'student' and is_active;

  select count(*) into v_active_personals
    from academy_members
   where academy_id = p_academy_id and role = 'personal' and is_active;

  select count(*) into v_workouts_this_week
    from workout_logs
   where academy_id = p_academy_id and created_at >= p_week_ago;

  select count(*) into v_workouts_last_week
    from workout_logs
   where academy_id = p_academy_id
     and created_at >= p_two_weeks_ago
     and created_at <  p_week_ago;

  select count(*) into v_new_this_month
    from academy_members
   where academy_id = p_academy_id
     and role = 'student'
     and joined_at >= p_month_ago;

  -- Alunos únicos que treinaram esta semana (pra calcular ativos/inativos)
  select coalesce(array_agg(distinct student_id), '{}'::uuid[])
    into v_active_student_ids
    from workout_logs
   where academy_id = p_academy_id
     and created_at >= p_week_ago
     and student_id is not null;

  v_active_this_week := cardinality(v_active_student_ids);

  -- Alunos ativos sem ficha ativa atribuída
  select count(*) into v_students_without_sheets
    from academy_members am
   where am.academy_id = p_academy_id
     and am.role = 'student'
     and am.is_active
     and not exists (
       select 1 from workout_sheets ws
        where ws.academy_id = p_academy_id
          and ws.student_id = am.user_id
          and ws.is_active
     );

  -- ── Recent students (limit 5) ──────────────────────────────
  with recent as (
    select id, user_id, joined_at
      from academy_members
     where academy_id = p_academy_id and role = 'student' and is_active
     order by joined_at desc
     limit 5
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',        r.id,
        'user_id',   r.user_id,
        'joined_at', r.joined_at,
        'full_name', p.full_name
      ) order by r.joined_at desc
    ),
    '[]'::jsonb
  ) into v_recent_students
  from recent r
  left join profiles p on p.id = r.user_id;

  -- ── Recent workouts (limit 8) com nome do aluno + ficha ────
  with recent as (
    select id, created_at, student_id, sheet_id, duration_seconds
      from workout_logs
     where academy_id = p_academy_id
     order by created_at desc
     limit 8
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',               r.id,
        'created_at',       r.created_at,
        'student_id',       r.student_id,
        'sheet_id',         r.sheet_id,
        'duration_seconds', r.duration_seconds,
        'student_name',     p.full_name,
        'sheet_name',       ws.name
      ) order by r.created_at desc
    ),
    '[]'::jsonb
  ) into v_recent_workouts
  from recent r
  left join profiles      p  on p.id  = r.student_id
  left join workout_sheets ws on ws.id = r.sheet_id;

  -- ── Inactive students (até 8) com último treino ────────────
  with all_students as (
    select user_id
      from academy_members
     where academy_id = p_academy_id and role = 'student' and is_active
     limit 100
  ),
  inactive as (
    select user_id from all_students
     where not (user_id = any(v_active_student_ids))
     limit 8
  ),
  last_logs as (
    select distinct on (student_id) student_id, created_at
      from workout_logs
     where academy_id = p_academy_id
       and student_id in (select user_id from inactive)
     order by student_id, created_at desc
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id',          i.user_id,
        'full_name',        p.full_name,
        'last_workout_at',  ll.created_at
      )
    ),
    '[]'::jsonb
  ) into v_inactive_students
  from inactive i
  left join profiles  p  on p.id        = i.user_id
  left join last_logs ll on ll.student_id = i.user_id;

  -- ── Personais ativos com contagem de alunos vinculados ─────
  with personais as (
    select user_id
      from academy_members
     where academy_id = p_academy_id and role = 'personal' and is_active
  ),
  student_counts as (
    select personal_id, count(distinct student_id) as cnt
      from workout_sheets
     where academy_id = p_academy_id and is_active
     group by personal_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id',       per.user_id,
        'full_name',     p.full_name,
        'student_count', coalesce(sc.cnt, 0)
      )
    ),
    '[]'::jsonb
  ) into v_personais_perf
  from personais per
  left join profiles       p  on p.id           = per.user_id
  left join student_counts sc on sc.personal_id = per.user_id;

  -- ── Resposta única ─────────────────────────────────────────
  return jsonb_build_object(
    'total_students',          v_total_students,
    'active_personals',        v_active_personals,
    'workouts_this_week',      v_workouts_this_week,
    'workouts_last_week',      v_workouts_last_week,
    'new_this_month',          v_new_this_month,
    'active_this_week',        v_active_this_week,
    'inactive_count',          greatest(0, v_total_students - v_active_this_week),
    'students_without_sheets', v_students_without_sheets,
    'recent_students',         v_recent_students,
    'recent_workouts',         v_recent_workouts,
    'inactive_students',       v_inactive_students,
    'personais_perf',          v_personais_perf
  );
end;
$$;

comment on function public.get_owner_dashboard is
  'Agrega métricas do dashboard do owner em 1 roundtrip. SECURITY INVOKER + check de role owner. Substitui ~14 queries Supabase do client.';

-- Grant ao role autenticado (RLS + permission check internos garantem segurança)
grant execute on function public.get_owner_dashboard(uuid, timestamptz, timestamptz, timestamptz) to authenticated;

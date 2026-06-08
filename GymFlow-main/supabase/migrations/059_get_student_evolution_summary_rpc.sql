-- ============================================================
-- GymFlow — RPC get_student_evolution_summary
-- Substitui as 3 queries do load inicial de /evolucao por 1.
-- Bucketização semanal fica no cliente (evita pegadinha de
-- timezone/dia-da-semana no Postgres).
-- ============================================================

create or replace function public.get_student_evolution_summary(
  p_academy_id  uuid,
  p_student_id  uuid,
  p_since       timestamptz
) returns jsonb
language plpgsql
security invoker
stable
as $$
declare
  v_weekly_logs jsonb;
  v_exercises   jsonb;
begin
  if p_student_id <> auth.uid() then
    raise exception 'AUTH_MISMATCH' using errcode = '42501';
  end if;

  -- Treinos completos no período + agregado de sets (reps/peso) pra cálculo
  -- de volume client-side.
  with workouts as (
    select id, created_at
      from workout_logs
     where academy_id = p_academy_id
       and student_id = p_student_id
       and completed_at is not null
       and created_at >= p_since
  ),
  sets_per_workout as (
    select sl.workout_log_id,
           coalesce(
             jsonb_agg(jsonb_build_object('reps_done', sl.reps_done, 'weight_kg', sl.weight_kg)),
             '[]'::jsonb
           ) as sets
      from set_logs sl
     where sl.workout_log_id in (select id from workouts)
     group by sl.workout_log_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',         w.id,
        'created_at', w.created_at,
        'set_logs',   coalesce(spw.sets, '[]'::jsonb)
      ) order by w.created_at
    ),
    '[]'::jsonb
  ) into v_weekly_logs
  from workouts w
  left join sets_per_workout spw on spw.workout_log_id = w.id;

  -- Exercícios distintos que o aluno fez com peso > 0 (pra popular o picker)
  with distinct_exercises as (
    select distinct ex.id, ex.name_pt as name
      from set_logs sl
      join workout_logs wl on wl.id = sl.workout_log_id
      join exercises    ex on ex.id = sl.exercise_id
     where wl.academy_id = p_academy_id
       and wl.student_id = p_student_id
       and sl.weight_kg is not null
       and sl.weight_kg > 0
  )
  select coalesce(
    jsonb_agg(jsonb_build_object('id', id, 'name', name) order by name),
    '[]'::jsonb
  ) into v_exercises
  from distinct_exercises;

  return jsonb_build_object(
    'weekly_logs', v_weekly_logs,
    'exercises',   v_exercises
  );
end;
$$;

comment on function public.get_student_evolution_summary is
  'Load inicial de /evolucao em 1 roundtrip: workouts+sets das últimas N semanas (bucketização semanal fica no cliente) + lista de exercícios feitos com peso.';

grant execute on function public.get_student_evolution_summary(uuid, uuid, timestamptz) to authenticated;

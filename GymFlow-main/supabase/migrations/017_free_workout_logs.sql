-- Allow students to log workouts without a personal trainer sheet
alter table workout_logs
  alter column sheet_id drop not null;

alter table workout_logs
  add column if not exists workout_type text;

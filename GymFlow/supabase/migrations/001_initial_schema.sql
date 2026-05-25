-- ============================================================
-- GymFlow — Esquema inicial
-- ============================================================

-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ──────────────────────────────────────────────
-- ENUMs
-- ──────────────────────────────────────────────
create type academy_plan as enum ('free', 'starter', 'pro');
create type member_role as enum ('owner', 'personal', 'student');
create type exercise_difficulty as enum ('beginner', 'intermediate', 'advanced');
create type subscription_status as enum ('active', 'canceled', 'past_due', 'trialing');

-- ──────────────────────────────────────────────
-- profiles
-- ──────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  full_name   text,
  avatar_url  text,
  phone       text,
  birth_date  date,
  gender      text check (gender in ('male', 'female', 'other')),
  height_cm   numeric(5,1),
  weight_kg   numeric(5,2),
  goal        text,
  bio         text
);

-- ──────────────────────────────────────────────
-- academies
-- ──────────────────────────────────────────────
create table academies (
  id                     uuid primary key default uuid_generate_v4(),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  owner_id               uuid not null references auth.users on delete restrict,
  name                   text not null,
  slug                   text not null unique,
  cnpj                   text unique,
  email                  text,
  phone                  text,
  address_street         text,
  address_number         text,
  address_complement     text,
  address_neighborhood   text,
  address_city           text,
  address_state          char(2),
  address_zip            text,
  logo_url               text,
  cover_url              text,
  photos                 text[],
  place_id               text,
  latitude               double precision,
  longitude              double precision,
  opening_hours          jsonb,
  plan                   academy_plan not null default 'free',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    subscription_status,
  trial_ends_at          timestamptz
);

create index idx_academies_owner on academies(owner_id);
create index idx_academies_slug  on academies(slug);

-- ──────────────────────────────────────────────
-- academy_members
-- ──────────────────────────────────────────────
create table academy_members (
  id           uuid primary key default uuid_generate_v4(),
  created_at   timestamptz not null default now(),
  academy_id   uuid not null references academies on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         member_role not null,
  is_active    boolean not null default true,
  invited_by   uuid references auth.users,
  joined_at    timestamptz,
  constraint uq_academy_member unique (academy_id, user_id)
);

create index idx_members_academy on academy_members(academy_id);
create index idx_members_user    on academy_members(user_id);
create index idx_members_role    on academy_members(academy_id, role);

-- ──────────────────────────────────────────────
-- invites
-- ──────────────────────────────────────────────
create table invites (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  academy_id  uuid not null references academies on delete cascade,
  created_by  uuid not null references auth.users on delete cascade,
  code        text not null,
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  role        member_role not null default 'student',
  uses_limit  int,
  uses_count  int not null default 0,
  is_active   boolean not null default true,
  email       text,
  constraint uq_academy_code unique (academy_id, code)
);

create index idx_invites_academy on invites(academy_id);
create index idx_invites_token   on invites(token);
create index idx_invites_code    on invites(code);

-- ──────────────────────────────────────────────
-- exercises (biblioteca global + custom)
-- ──────────────────────────────────────────────
create table exercises (
  id             uuid primary key default uuid_generate_v4(),
  created_at     timestamptz not null default now(),
  name           text not null,
  name_pt        text not null,
  description    text,
  muscle_groups  text[] not null default '{}',
  equipment      text[] not null default '{}',
  difficulty     exercise_difficulty not null default 'beginner',
  video_url      text,
  image_url      text,
  instructions   text[],
  is_global      boolean not null default false,
  created_by     uuid references auth.users,
  academy_id     uuid references academies on delete cascade
);

create index idx_exercises_global    on exercises(is_global);
create index idx_exercises_academy   on exercises(academy_id);
create index idx_exercises_muscles   on exercises using gin(muscle_groups);

-- ──────────────────────────────────────────────
-- workout_sheets (fichas)
-- ──────────────────────────────────────────────
create table workout_sheets (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  academy_id    uuid not null references academies on delete cascade,
  student_id    uuid not null references auth.users on delete cascade,
  personal_id   uuid not null references auth.users on delete cascade,
  name          text not null,
  goal          text,
  description   text,
  is_active     boolean not null default true,
  valid_until   date,
  order_index   smallint not null default 0
);

create index idx_sheets_student   on workout_sheets(student_id);
create index idx_sheets_personal  on workout_sheets(personal_id);
create index idx_sheets_academy   on workout_sheets(academy_id);

-- ──────────────────────────────────────────────
-- sheet_exercises
-- ──────────────────────────────────────────────
create table sheet_exercises (
  id                 uuid primary key default uuid_generate_v4(),
  created_at         timestamptz not null default now(),
  sheet_id           uuid not null references workout_sheets on delete cascade,
  exercise_id        uuid not null references exercises on delete restrict,
  order_index        smallint not null default 0,
  sets               smallint not null default 3,
  reps               text not null default '12',  -- ex: "8-12", "12", "até a falha"
  rest_seconds       smallint not null default 60,
  notes              text,
  weight_suggestion  numeric(6,2),
  rpe_target         smallint check (rpe_target between 1 and 10)
);

create index idx_sheet_exercises_sheet on sheet_exercises(sheet_id);

-- ──────────────────────────────────────────────
-- workout_logs (sessões)
-- ──────────────────────────────────────────────
create table workout_logs (
  id                uuid primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now(),
  completed_at      timestamptz,
  student_id        uuid not null references auth.users on delete cascade,
  sheet_id          uuid not null references workout_sheets on delete cascade,
  academy_id        uuid not null references academies on delete cascade,
  duration_seconds  int,
  notes             text,
  rating            smallint check (rating between 1 and 5),
  perceived_effort  smallint check (perceived_effort between 1 and 10)
);

create index idx_logs_student  on workout_logs(student_id);
create index idx_logs_sheet    on workout_logs(sheet_id);
create index idx_logs_academy  on workout_logs(academy_id);
create index idx_logs_date     on workout_logs(created_at desc);

-- ──────────────────────────────────────────────
-- set_logs (séries de cada sessão)
-- ──────────────────────────────────────────────
create table set_logs (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  workout_log_id      uuid not null references workout_logs on delete cascade,
  sheet_exercise_id   uuid not null references sheet_exercises on delete cascade,
  exercise_id         uuid not null references exercises on delete cascade,
  set_number          smallint not null,
  reps_done           smallint not null default 0,
  weight_kg           numeric(6,2),
  duration_seconds    int,
  notes               text,
  is_completed        boolean not null default false
);

create index idx_set_logs_workout  on set_logs(workout_log_id);
create index idx_set_logs_exercise on set_logs(exercise_id);

-- ──────────────────────────────────────────────
-- Funções helper
-- ──────────────────────────────────────────────
create or replace function get_user_academy_ids()
returns uuid[] language sql security definer stable as $$
  select array(
    select academy_id from academy_members
    where user_id = auth.uid() and is_active = true
  );
$$;

create or replace function get_user_role_in_academy(p_academy_id uuid)
returns member_role language sql security definer stable as $$
  select role from academy_members
  where user_id = auth.uid() and academy_id = p_academy_id and is_active = true
  limit 1;
$$;

-- Slug automático para academia
create or replace function generate_academy_slug(name text)
returns text language plpgsql as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  base_slug := lower(regexp_replace(unaccent(name), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;

  while exists (select 1 from academies where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  return final_slug;
end;
$$;

-- Trigger: atualizar updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_academies_updated_at
  before update on academies
  for each row execute function set_updated_at();

create trigger trg_sheets_updated_at
  before update on workout_sheets
  for each row execute function set_updated_at();

-- Trigger: criar profile automaticamente ao signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

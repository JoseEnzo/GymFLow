-- 075_contact_requests.sql
-- Diretório público de academias + caixa de solicitações de contato.
--
-- Contexto: a landing ganhou a página pública /academias. Visitante anônimo pode
--   (1) ver as academias cadastradas com CONTAGENS (nº de alunos / personais) —
--       NUNCA nome de pessoa (PII). Isolamento multi-tenant + LGPD intactos.
--   (2) "pedir convite" deixando email/telefone/whatsapp. Vira um lead na caixa
--       de solicitações do dashboard do dono/personal da academia.

-- ──────────────────────────────────────────────
-- 1) Tabela de solicitações de contato (leads públicos)
-- ──────────────────────────────────────────────
create table if not exists public.contact_requests (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid not null references public.academies(id) on delete cascade,
  name        text,
  email       text,
  phone       text,
  message     text,
  status      text not null default 'new',  -- new | handled
  created_at  timestamptz not null default now(),
  -- precisa de pelo menos uma forma de contato
  constraint contact_requests_contact_chk check (email is not null or phone is not null)
);

create index if not exists contact_requests_academy_created_idx
  on public.contact_requests (academy_id, created_at desc);

alter table public.contact_requests enable row level security;

-- SELECT: owner/personal da academia veem as solicitações da própria academia.
create policy "contact_requests_select_staff"
  on public.contact_requests for select
  using (
    academy_id = any (get_user_academy_ids())
    and get_user_role_in_academy(academy_id) in ('owner', 'personal')
  );

-- UPDATE: owner/personal marcam como resolvido (status).
create policy "contact_requests_update_staff"
  on public.contact_requests for update
  using (
    academy_id = any (get_user_academy_ids())
    and get_user_role_in_academy(academy_id) in ('owner', 'personal')
  )
  with check (
    academy_id = any (get_user_academy_ids())
    and get_user_role_in_academy(academy_id) in ('owner', 'personal')
  );

-- INSERT: SEM policy de propósito. Inserção é exclusivamente server-side via
-- service_role (POST /api/academias/contact, protegido por Turnstile + rate limit).
-- Cliente com anon/auth NÃO insere — evita spam direto na tabela e enumeração.

-- ──────────────────────────────────────────────
-- 2) Diretório público (contagens, SEM PII)
-- ──────────────────────────────────────────────
-- SECURITY DEFINER porque precisa varrer academies + academy_members de TODOS os
-- tenants, mas retorna SÓ colunas públicas + contagens agregadas (nome/contato de
-- pessoa NUNCA sai daqui). É o padrão sancionado no CLAUDE.md: coluna pública
-- servida por função controlada, nunca por policy de SELECT ampla na tabela.
create or replace function public.get_public_academies()
returns table (
  id             uuid,
  name           text,
  slug           text,
  city           text,
  state          text,
  logo_url       text,
  student_count  bigint,
  personal_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    a.id,
    a.name,
    a.slug,
    a.address_city  as city,
    a.address_state as state,
    a.logo_url,
    coalesce(s.cnt, 0) as student_count,
    coalesce(p.cnt, 0) as personal_count
  from public.academies a
  left join (
    select academy_id, count(*) as cnt
    from public.academy_members
    where role = 'student' and is_active = true
    group by academy_id
  ) s on s.academy_id = a.id
  left join (
    select academy_id, count(*) as cnt
    from public.academy_members
    where role = 'personal' and is_active = true
    group by academy_id
  ) p on p.academy_id = a.id
  order by a.name;
$$;

revoke all on function public.get_public_academies() from public;
grant execute on function public.get_public_academies() to anon, authenticated;

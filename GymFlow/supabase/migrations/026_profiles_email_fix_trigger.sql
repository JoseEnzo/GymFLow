-- ============================================================
-- GymFlow — Adiciona email em profiles e corrige trigger:
--   1. Adiciona coluna `email` na tabela profiles
--   2. Corrige handle_new_user: não armazena CNPJ do dono como CPF;
--      só copia document→cpf quando account_type = 'personal'
--   3. Faz backfill do email para perfis já existentes
-- ============================================================

alter table profiles add column if not exists email text;

create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, avatar_url, cpf, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    case
      when new.raw_user_meta_data ->> 'account_type' = 'personal'
      then new.raw_user_meta_data ->> 'document'
      else null
    end,
    new.email
  );
  return new;
end;
$$;

-- Backfill email para usuários existentes que ainda não têm email em profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

-- Limpa CNPJ que foi armazenado erroneamente em profiles.cpf para owners
-- (owners têm account_type = 'owner' e CNPJ tem 14 dígitos)
update public.profiles p
set cpf = null
from auth.users u
where p.id = u.id
  and (u.raw_user_meta_data ->> 'account_type') = 'owner'
  and p.cpf is not null;

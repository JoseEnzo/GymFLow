-- ============================================================
-- GymFlow — Adiciona CPF à tabela profiles
-- ============================================================
-- Problema: o CPF do personal trainer era salvo apenas em
-- auth.users.user_metadata, nunca na tabela profiles.
-- Solução: adicionar coluna cpf em profiles e atualizar o
-- trigger handle_new_user para copiar o document do metadata.
-- ============================================================

alter table profiles add column if not exists cpf text;

create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, avatar_url, cpf)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'document'
  );
  return new;
end;
$$;

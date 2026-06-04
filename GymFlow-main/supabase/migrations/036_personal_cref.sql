-- ============================================================
-- GymFlow — Personal usa CREF em vez de CPF
-- ============================================================
-- O personal trainer passa a se cadastrar e logar com o CREF
-- (registro profissional), não com CPF. Adicionamos a coluna
-- cref em profiles e o trigger handle_new_user passa a rotear o
-- metadata 'document' para cref (personal) ou cpf (owner/student).
-- ============================================================

alter table profiles add column if not exists cref text;

create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, avatar_url, cpf, cref, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    -- cpf só para aluno (owner não deve ter CNPJ gravado como cpf — ver 026)
    case when new.raw_user_meta_data ->> 'account_type' = 'student'
         then new.raw_user_meta_data ->> 'document' else null end,
    -- cref só para personal
    case when new.raw_user_meta_data ->> 'account_type' = 'personal'
         then upper(new.raw_user_meta_data ->> 'document') else null end,
    new.email
  );
  return new;
end;
$$;

-- Backfill: personais existentes têm o CREF gravado em cpf (trigger antigo 026)
-- ou apenas no metadata. Move para cref e limpa o cpf.
update public.profiles p
set cref = upper(coalesce(nullif(p.cpf, ''), u.raw_user_meta_data ->> 'document')),
    cpf  = null
from auth.users u
where p.id = u.id
  and u.raw_user_meta_data ->> 'account_type' = 'personal'
  and p.cref is null
  and coalesce(nullif(p.cpf, ''), u.raw_user_meta_data ->> 'document') is not null;

-- CREF único entre personals (índice parcial permite múltiplos NULL).
create unique index if not exists uq_profiles_cref
  on profiles (cref)
  where cref is not null;

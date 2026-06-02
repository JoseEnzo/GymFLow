-- ============================================================
-- GymFlow — Storage: bucket avatars
-- ============================================================

-- Criar bucket público para avatares de usuários
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,                          -- público: URL acessível sem autenticação
  2097152,                       -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;    -- idempotente: não falha se já existir

-- ── RLS policies ────────────────────────────────────────────

-- Qualquer usuário autenticado pode fazer upload no próprio path (avatars/<user_id>.ext)
create policy "Usuário faz upload do próprio avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and starts_with(storage.filename(name), auth.uid()::text)
);

-- Qualquer usuário autenticado pode atualizar o próprio avatar
create policy "Usuário atualiza o próprio avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and starts_with(storage.filename(name), auth.uid()::text)
);

-- Leitura pública (bucket já é público, mas garantir via policy)
create policy "Avatar público para leitura"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- Usuário pode deletar o próprio avatar
create policy "Usuário deleta o próprio avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and starts_with(storage.filename(name), auth.uid()::text)
);

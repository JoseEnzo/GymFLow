-- Restrict avatar SELECT from fully public (anon accessible) to authenticated only.
-- Avatars are profile pictures visible only to logged-in users.
DROP POLICY "Avatar público para leitura" ON storage.objects;

CREATE POLICY "Avatar leitura autenticada" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
  );

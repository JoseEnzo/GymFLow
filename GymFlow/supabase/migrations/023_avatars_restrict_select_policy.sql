-- Restrict avatar SELECT from fully public (anon accessible) to authenticated only.
-- Avatars are profile pictures visible only to logged-in users.
DROP POLICY IF EXISTS "Avatar público para leitura" ON storage.objects;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatar leitura autenticada'
  ) THEN
    CREATE POLICY "Avatar leitura autenticada" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'avatars'
        AND auth.uid() IS NOT NULL
      );
  END IF;
END $$;

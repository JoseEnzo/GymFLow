-- Consolidate multiple permissive policies per table+cmd into single policies.
-- Multiple permissive policies cause Postgres to evaluate all of them and OR the results,
-- which adds overhead. A single policy with an explicit OR is evaluated once per row.

-- ── academies SELECT ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Academia visível para quem tem convite ativo" ON public.academies;
DROP POLICY IF EXISTS "Membros vêem suas academias" ON public.academies;
DROP POLICY IF EXISTS "Academias visíveis para membros ou convite ativo" ON public.academies;
CREATE POLICY "Academias visíveis para membros ou convite ativo" ON public.academies
  FOR SELECT USING (
    (id = ANY (get_user_academy_ids()))
    OR (EXISTS (
      SELECT 1 FROM invites
      WHERE invites.academy_id = academies.id AND invites.is_active = true
    ))
  );

-- ── academy_members INSERT ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner e personal gerenciam membros" ON public.academy_members;
DROP POLICY IF EXISTS "Usuário entra via convite" ON public.academy_members;
DROP POLICY IF EXISTS "Inserção de membros" ON public.academy_members;
CREATE POLICY "Inserção de membros" ON public.academy_members
  FOR INSERT WITH CHECK (
    (get_user_role_in_academy(academy_id) = ANY (ARRAY['owner'::member_role, 'personal'::member_role]))
    OR ((SELECT auth.uid()) = user_id)
  );

-- ── agenda_completions SELECT ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "personal sees academy completions" ON public.agenda_completions;
DROP POLICY IF EXISTS "student sees own completions" ON public.agenda_completions;
DROP POLICY IF EXISTS "Completions visíveis para membro da academia ou próprio aluno" ON public.agenda_completions;
CREATE POLICY "Completions visíveis para membro da academia ou próprio aluno" ON public.agenda_completions
  FOR SELECT USING (
    (academy_id = ANY (get_user_academy_ids()))
    OR (student_id = (SELECT auth.uid()))
  );

-- ── bioimpedance_assessments SELECT ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Aluno vê próprias avaliações" ON public.bioimpedance_assessments;
DROP POLICY IF EXISTS "Personal e owner vêem avaliações da academia" ON public.bioimpedance_assessments;
DROP POLICY IF EXISTS "Avaliações visíveis para aluno ou personal/owner da academia" ON public.bioimpedance_assessments;
CREATE POLICY "Avaliações visíveis para aluno ou personal/owner da academia" ON public.bioimpedance_assessments
  FOR SELECT USING (
    (student_id = (SELECT auth.uid()))
    OR (get_user_role_in_academy(academy_id) = ANY (ARRAY['owner'::member_role, 'personal'::member_role]))
  );

-- ── body_measurements SELECT ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Aluno vê próprias medidas" ON public.body_measurements;
DROP POLICY IF EXISTS "Personal e owner vêem medidas da academia" ON public.body_measurements;
DROP POLICY IF EXISTS "Medidas visíveis para aluno ou personal/owner da academia" ON public.body_measurements;
CREATE POLICY "Medidas visíveis para aluno ou personal/owner da academia" ON public.body_measurements
  FOR SELECT USING (
    (student_id = (SELECT auth.uid()))
    OR (get_user_role_in_academy(academy_id) = ANY (ARRAY['owner'::member_role, 'personal'::member_role]))
  );

-- ── invites INSERT ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner cria convites" ON public.invites;
DROP POLICY IF EXISTS "Personal cria convites de aluno" ON public.invites;
DROP POLICY IF EXISTS "Criação de convites" ON public.invites;
CREATE POLICY "Criação de convites" ON public.invites
  FOR INSERT WITH CHECK (
    (get_user_role_in_academy(academy_id) = 'owner'::member_role)
    OR ((get_user_role_in_academy(academy_id) = 'personal'::member_role) AND (role = 'student'::member_role))
  );

-- ── invites SELECT ───────────────────────────────────────────────────────────────
-- Drop the overly-permissive `true` policy; "Membros vêem convites da academia"
-- already covers anonymous lookup via `token IS NOT NULL`.
DROP POLICY IF EXISTS "Qualquer um pode ver convite por token" ON public.invites;

-- ── invites UPDATE ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner e personal gerenciam convites" ON public.invites;
DROP POLICY IF EXISTS "Owner revoga convites da academia" ON public.invites;
DROP POLICY IF EXISTS "Atualização de convites" ON public.invites;
CREATE POLICY "Atualização de convites" ON public.invites
  FOR UPDATE USING (
    (get_user_role_in_academy(academy_id) = ANY (ARRAY['owner'::member_role, 'personal'::member_role]))
    OR (auth.role() = 'service_role'::text)
  );

-- ── profiles SELECT ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Membros da mesma academia vêem perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuário vê seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Perfis visíveis para próprio usuário ou colegas de academia" ON public.profiles;
CREATE POLICY "Perfis visíveis para próprio usuário ou colegas de academia" ON public.profiles
  FOR SELECT USING (
    (id = (SELECT auth.uid()))
    OR (id IN (
      SELECT academy_members.user_id
      FROM academy_members
      WHERE academy_members.academy_id = ANY (get_user_academy_ids())
        AND academy_members.is_active = true
    ))
  );

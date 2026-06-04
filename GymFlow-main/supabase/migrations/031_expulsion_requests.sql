-- Tabela de pedidos de expulsão de alunos
-- Criada quando um personal solicita a remoção de um aluno.
-- O owner aprova ou rejeita; somente após aprovação o aluno é inativado.

CREATE TABLE IF NOT EXISTS expulsion_requests (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id        uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  student_id        uuid NOT NULL,
  student_member_id uuid NOT NULL REFERENCES academy_members(id) ON DELETE CASCADE,
  requested_by      uuid NOT NULL,
  reason            text NOT NULL,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at        timestamptz DEFAULT now(),
  resolved_at       timestamptz,
  resolved_by       uuid
);

ALTER TABLE expulsion_requests ENABLE ROW LEVEL SECURITY;

-- Owner: acesso total aos pedidos da sua academia
CREATE POLICY "owner_full_expulsion_requests"
ON expulsion_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM academy_members am
    WHERE am.academy_id = expulsion_requests.academy_id
      AND am.user_id    = auth.uid()
      AND am.role       = 'owner'
      AND am.is_active  = true
  )
);

-- Personal: pode criar pedidos para sua academia
CREATE POLICY "personal_insert_expulsion_requests"
ON expulsion_requests
FOR INSERT
WITH CHECK (
  requested_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM academy_members am
    WHERE am.academy_id = expulsion_requests.academy_id
      AND am.user_id    = auth.uid()
      AND am.role       = 'personal'
      AND am.is_active  = true
  )
);

-- Personal: pode ver seus próprios pedidos
CREATE POLICY "personal_select_own_expulsion_requests"
ON expulsion_requests
FOR SELECT
USING (requested_by = auth.uid());

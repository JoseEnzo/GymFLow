-- 071_plan_limits_in_accept_invite.sql
--
-- Adiciona verificação de limites de plano dentro da RPC accept_invite,
-- garantindo que convites multi-uso não ultrapassem as cotas do plano
-- mesmo quando a academia chega no limite entre a criação e o aceite do convite.
--
-- Novos erros nomeados:
--   PLAN_LIMIT_STUDENTS  → Starter atingiu 50 alunos ativos
--   PLAN_LIMIT_PERSONALS → Starter atingiu 3 personais ativos
--   PLAN_NO_SUBPERSONALS → Plano Personal não permite sub-personais

CREATE OR REPLACE FUNCTION public.accept_invite(
  p_token   text,
  p_user_id uuid
)
RETURNS TABLE (
  academy_id    uuid,
  academy_name  text,
  academy_slug  text,
  role          member_role
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_invite          invites%ROWTYPE;
  v_already_member  boolean;
  v_academy_plan    text;
  v_member_count    bigint;
BEGIN
  -- Lock pessimista no invite. Serializa aceites concorrentes do MESMO
  -- convite, fechando a janela TOCTOU entre check do uses_limit e o UPDATE.
  SELECT * INTO v_invite
  FROM invites
  WHERE token = p_token
    AND is_active = true
  FOR UPDATE;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'INVITE_UNAVAILABLE' USING ERRCODE = 'P0002';
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at <= now() THEN
    RAISE EXCEPTION 'INVITE_EXPIRED' USING ERRCODE = 'P0002';
  END IF;

  -- Defesa em profundidade: convite com role 'owner' não pode ser aceito.
  IF v_invite.role NOT IN ('student'::member_role, 'personal'::member_role) THEN
    RAISE EXCEPTION 'INVALID_ROLE' USING ERRCODE = '22023';
  END IF;

  -- Idempotência: mesmo user clicando 2x no link não consome o convite 2x.
  SELECT EXISTS (
    SELECT 1 FROM academy_members
    WHERE academy_members.academy_id = v_invite.academy_id
      AND academy_members.user_id = p_user_id
  ) INTO v_already_member;

  IF v_already_member THEN
    -- Refresh sem incrementar uses_count (já era membro — limites não se aplicam).
    UPDATE academy_members
    SET is_active = true,
        role      = v_invite.role,
        joined_at = COALESCE(joined_at, now())
    WHERE academy_members.academy_id = v_invite.academy_id
      AND academy_members.user_id = p_user_id;
  ELSE
    -- Novo aceite: verifica uses_limit e limites do plano antes do INSERT.
    IF v_invite.uses_limit IS NOT NULL AND v_invite.uses_count >= v_invite.uses_limit THEN
      RAISE EXCEPTION 'INVITE_EXHAUSTED' USING ERRCODE = 'P0002';
    END IF;

    -- Busca o plano atual da academia (lock NOT necessário aqui — o plano raramente
    -- muda e a RPC já tem o lock no invite; downgrade durante o aceite é edge case
    -- aceitável de falso-positivo em vez de falso-negativo).
    SELECT plan INTO v_academy_plan
    FROM academies
    WHERE id = v_invite.academy_id;

    IF v_academy_plan = 'personal' AND v_invite.role = 'personal' THEN
      RAISE EXCEPTION 'PLAN_NO_SUBPERSONALS' USING ERRCODE = 'P0002';
    END IF;

    IF v_academy_plan = 'starter' THEN
      IF v_invite.role = 'student' THEN
        SELECT COUNT(*) INTO v_member_count
        FROM academy_members
        WHERE academy_id = v_invite.academy_id
          AND role = 'student'
          AND is_active = true;

        IF v_member_count >= 50 THEN
          RAISE EXCEPTION 'PLAN_LIMIT_STUDENTS' USING ERRCODE = 'P0002';
        END IF;

      ELSIF v_invite.role = 'personal' THEN
        SELECT COUNT(*) INTO v_member_count
        FROM academy_members
        WHERE academy_id = v_invite.academy_id
          AND role = 'personal'
          AND is_active = true;

        IF v_member_count >= 3 THEN
          RAISE EXCEPTION 'PLAN_LIMIT_PERSONALS' USING ERRCODE = 'P0002';
        END IF;
      END IF;
    END IF;

    INSERT INTO academy_members (
      academy_id, user_id, role, is_active, joined_at, invited_by
    )
    VALUES (
      v_invite.academy_id, p_user_id, v_invite.role, true, now(), v_invite.created_by
    );

    UPDATE invites
    SET uses_count = uses_count + 1
    WHERE id = v_invite.id;
  END IF;

  RETURN QUERY
    SELECT a.id, a.name, a.slug, v_invite.role
    FROM academies a
    WHERE a.id = v_invite.academy_id;
END;
$$;

-- Mantém os mesmos grants da migration 030.
REVOKE EXECUTE ON FUNCTION public.accept_invite(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invite(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_invite(text, uuid) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.accept_invite(text, uuid) TO service_role;

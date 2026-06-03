-- RPC accept_invite: claim atômico do convite (resolve race no uses_count +
-- TOCTOU no uses_limit) com idempotência por usuário.
--
-- Chamada apenas pelo service_role (via /api/invites/accept), porque precisa
-- modificar invites + academy_members num contexto onde o user ainda não é
-- membro. Não é exposta a authenticated/anon — segue padrão do código antigo
-- que usava admin client.

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

  -- Defesa em profundidade: convite com role 'owner' (raro, mas possível por
  -- inserção direta no banco) não pode ser aceito.
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
    -- Refresh sem incrementar uses_count.
    UPDATE academy_members
    SET is_active = true,
        role      = v_invite.role,
        joined_at = COALESCE(joined_at, now())
    WHERE academy_members.academy_id = v_invite.academy_id
      AND academy_members.user_id = p_user_id;
  ELSE
    -- Novo aceite — só agora cobra do uses_limit.
    IF v_invite.uses_limit IS NOT NULL AND v_invite.uses_count >= v_invite.uses_limit THEN
      RAISE EXCEPTION 'INVITE_EXHAUSTED' USING ERRCODE = 'P0002';
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

-- Grants: só service_role chama (via API route com admin client).
-- Não expõe a anon nem authenticated.
REVOKE EXECUTE ON FUNCTION public.accept_invite(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invite(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_invite(text, uuid) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.accept_invite(text, uuid) TO service_role;

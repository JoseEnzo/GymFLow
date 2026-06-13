import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-guard'
import { clientIp } from '@/lib/turnstile'
import { rateLimit, tooManyRequests, RATE_LIMITS } from '@/lib/rate-limit'

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Mapeia exceções nomeadas da RPC pra HTTP + mensagem amigável.
function mapRpcError(message: string): { status: number; error: string } | null {
  if (message.includes('INVITE_EXPIRED'))     return { status: 410, error: 'Este convite expirou' }
  if (message.includes('INVITE_EXHAUSTED'))   return { status: 409, error: 'Este convite já foi utilizado' }
  if (message.includes('INVITE_UNAVAILABLE')) return { status: 404, error: 'Convite não encontrado ou inválido' }
  if (message.includes('INVALID_ROLE'))       return { status: 400, error: 'Convite com configuração inválida' }
  return null
}

export async function POST(request: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  // Limite por IP: trava brute-force de token de convite mesmo autenticado.
  const rl = rateLimit(`invite-accept:${clientIp(request)}`, RATE_LIMITS.invite)
  if (!rl.success) return tooManyRequests(rl.retryAfterSec)

  let token: string
  try {
    const body = await request.json() as { token?: string }
    token = body.token?.trim() ?? ''
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })

  // Valida account_type do usuário contra o role do convite antes de chamar a RPC.
  // Impede que um personal aceite convite de aluno (e vice-versa).
  const { data: { user: fullUser } } = await admin.auth.admin.getUserById(user.id)
  const accountType = fullUser?.user_metadata?.['account_type'] as string | undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inviteRow } = await (admin as any)
    .from('invites')
    .select('role')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (inviteRow) {
    const inviteRole = inviteRow.role as string
    const accountMatchesRole =
      (accountType === 'student'  && inviteRole === 'student') ||
      (accountType === 'personal' && inviteRole === 'personal')

    if (!accountMatchesRole) {
      const roleLabel = inviteRole === 'personal' ? 'personal trainer' : 'aluno'
      return NextResponse.json(
        { error: `Este convite é para ${roleLabel}. Sua conta tem um perfil diferente e não pode aceitar este convite.` },
        { status: 403 },
      )
    }
  }

  // RPC atômica: lock no invite, idempotência por (academy, user), incremento
  // condicional do uses_count. Resolve race condition + TOCTOU do código antigo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).rpc('accept_invite', {
    p_token: token,
    p_user_id: user.id,
  })

  if (error) {
    const mapped = mapRpcError(error.message ?? '')
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status })
    console.error('[invites/accept]', error)
    return NextResponse.json({ error: 'Erro ao aceitar convite' }, { status: 500 })
  }

  const row = (data ?? [])[0] as
    | { academy_id: string; academy_name: string; academy_slug: string; role: string }
    | undefined

  if (!row) {
    return NextResponse.json({ error: 'Academia não encontrada' }, { status: 404 })
  }

  return NextResponse.json({
    academyName: row.academy_name,
    academySlug: row.academy_slug,
    role: row.role,
  })
}

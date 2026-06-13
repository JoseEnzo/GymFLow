import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-guard'
import { rateLimit, tooManyRequests, RATE_LIMITS } from '@/lib/rate-limit'

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  // Limite por usuário: evita geração em massa de convites por uma conta.
  const rl = rateLimit(`invite-create:${user.id}`, RATE_LIMITS.invite)
  if (!rl.success) return tooManyRequests(rl.retryAfterSec)

  let body: { academyId?: string; role?: string; expiresAt?: string | null; usesLimit?: number | null }
  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // expiresAt: campo ausente → default 30 dias; null → "nunca expira"
  // (opção explícita nos modais de alunos/personais — não tratar como ausente).
  const { academyId, role, usesLimit = 1 } = body
  const expiresAt = body.expiresAt === undefined
    ? new Date(Date.now() + 30 * 86_400_000).toISOString()
    : body.expiresAt

  if (!academyId) return NextResponse.json({ error: 'academyId obrigatório' }, { status: 400 })
  if (role !== 'student' && role !== 'personal') {
    return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
  }

  // Verifica se o usuário é owner ou personal da academia
  const { data: member } = await admin
    .from('academy_members')
    .select('role')
    .eq('academy_id', academyId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Personal só pode convidar aluno
  if (member.role === 'personal' && role !== 'student') {
    return NextResponse.json({ error: 'Personal só pode convidar alunos' }, { status: 403 })
  }

  if (member.role !== 'owner' && member.role !== 'personal') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Checar limites do plano antes de criar o convite
  const { data: academy } = await admin
    .from('academies')
    .select('plan')
    .eq('id', academyId)
    .single()

  if (academy) {
    const plan = academy.plan as string

    if (plan === 'personal' && role === 'personal') {
      return NextResponse.json(
        { error: 'O plano Personal não permite sub-personais. Faça upgrade para Starter ou Pro.' },
        { status: 403 },
      )
    }

    if (plan === 'starter') {
      if (role === 'student') {
        const { count } = await admin
          .from('academy_members')
          .select('*', { count: 'exact', head: true })
          .eq('academy_id', academyId)
          .eq('role', 'student')
          .eq('is_active', true)
        if ((count ?? 0) >= 50) {
          return NextResponse.json(
            { error: 'Limite de 50 alunos do plano Starter atingido. Faça upgrade para Pro para adicionar mais alunos.' },
            { status: 403 },
          )
        }
      } else if (role === 'personal') {
        const { count } = await admin
          .from('academy_members')
          .select('*', { count: 'exact', head: true })
          .eq('academy_id', academyId)
          .eq('role', 'personal')
          .eq('is_active', true)
        if ((count ?? 0) >= 3) {
          return NextResponse.json(
            { error: 'Limite de 3 personais do plano Starter atingido. Faça upgrade para Pro para adicionar mais personais.' },
            { status: 403 },
          )
        }
      }
    }
  }

  const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code = Array.from({ length: 8 }, () => SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]).join('')
  const token = crypto.randomUUID()

  const { data, error } = await admin
    .from('invites')
    .insert({
      academy_id: academyId,
      created_by: user.id,
      code,
      token,
      role,
      expires_at: expiresAt ?? null,
      uses_limit: usesLimit ?? null,
    })
    .select('code, token, expires_at, uses_limit')
    .single()

  if (error) {
    console.error('[invites/create]', error)
    return NextResponse.json({ error: 'Erro ao criar convite' }, { status: 500 })
  }

  return NextResponse.json({
    code: data.code,
    token: data.token,
    expiresAt: data.expires_at,
    usesLimit: data.uses_limit,
  })
}

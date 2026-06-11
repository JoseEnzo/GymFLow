import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

import { limiters } from '@/lib/rate-limit'
import { clientIp } from '@/lib/turnstile'

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const INVITE_FIELDS =
  'token, code, role, expires_at, uses_count, uses_limit, is_active, academy:academies(name, slug)'

type InviteRow = {
  token: string
  code: string
  role: string
  expires_at: string | null
  uses_count: number | null
  uses_limit: number | null
  is_active: boolean
  // academy:academies(...) é relação to-one — PostgREST retorna objeto em runtime.
  academy: { name: string; slug: string } | null
}

function isExpired(row: InviteRow) {
  return Boolean(row.expires_at && new Date(row.expires_at) < new Date())
}

function isExhausted(row: InviteRow) {
  return Boolean(row.uses_limit && (row.uses_count ?? 0) >= row.uses_limit)
}

export async function GET(request: Request) {
  // Rota pública (allowlist do middleware) que resolve segredos compartilháveis
  // (token/código) com service_role — rate limit obrigatório.
  const ip = clientIp(request)
  const { success: rlOk } = await limiters.invite.limit(`lookup:${ip}`)
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')?.trim() ?? ''
  const code = searchParams.get('code')?.trim().toUpperCase() ?? ''

  if (!token && !code) {
    return NextResponse.json({ error: 'Token ou código obrigatório' }, { status: 400 })
  }

  let row: InviteRow | null = null

  if (token) {
    const { data, error } = await admin
      .from('invites')
      .select(INVITE_FIELDS)
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Convite não encontrado ou expirado' }, { status: 404 })
    }
    row = data as unknown as InviteRow

    if (isExpired(row)) {
      return NextResponse.json({ error: 'Este convite expirou' }, { status: 410 })
    }
    if (isExhausted(row)) {
      return NextResponse.json({ error: 'Este convite já foi utilizado' }, { status: 409 })
    }
  } else {
    // code é único só por academia (UNIQUE academy_id+code) — em colisão entre
    // academias (raro com 8 chars), prefere o convite válido mais recente.
    const { data } = await admin
      .from('invites')
      .select(INVITE_FIELDS)
      .eq('code', code)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5)

    row = ((data ?? []) as unknown as InviteRow[]).find((r) => !isExpired(r) && !isExhausted(r)) ?? null
    if (!row) {
      return NextResponse.json({ error: 'Convite não encontrado ou expirado' }, { status: 404 })
    }
  }

  const academy = row.academy
  if (!academy) {
    return NextResponse.json({ error: 'Academia não encontrada' }, { status: 404 })
  }

  return NextResponse.json({
    token: row.token,
    code: row.code,
    role: row.role as 'personal' | 'student',
    expiresAt: row.expires_at,
    usesCount: row.uses_count ?? 0,
    academyName: academy.name,
    academySlug: academy.slug,
  })
}

import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/server'
import { validateCNPJ, validateCPF, validateCREF, normalizeCREF } from '@/lib/cnpj'
import { limiters } from '@/lib/rate-limit'
import { lookupSchema } from '@/lib/validations'
import { verifyTurnstileToken, clientIp } from '@/lib/turnstile'

const GENERIC_ERROR = 'Credenciais inválidas'

export async function POST(request: Request) {
  const ip = clientIp(request)

  // 1. Rate limit por IP (5 tentativas / 15 min)
  const { success: rlOk } = await limiters.auth.limit(`lookup:${ip}`)
  if (!rlOk) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
      { status: 429 },
    )
  }

  // 2. Parse + valida body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
  }
  const parsed = lookupSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
  }
  const { identifier, type, token } = parsed.data

  // 3. Verifica Turnstile server-side
  const captchaOk = await verifyTurnstileToken(token, ip)
  if (!captchaOk) {
    return NextResponse.json(
      { error: 'Verificação de segurança falhou. Tente novamente.' },
      { status: 403 },
    )
  }

  // 4. Lookup do email — mensagem genérica em qualquer falha (anti-enumeração)
  const clean = identifier.replace(/\D/g, '')
  const admin = await createAdminClient()

  try {
    if (type === 'cnpj') {
      if (!validateCNPJ(clean)) {
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: academy } = await (admin as any)
        .from('academies')
        .select('owner_id')
        .eq('cnpj', clean)
        .single()

      if (academy?.owner_id) {
        const { data: { user } } = await admin.auth.admin.getUserById(academy.owner_id)
        if (user?.email) return NextResponse.json({ email: user.email })
      }

      // Fallback: dono cadastrado que ainda não criou academia — CNPJ está só nos
      // metadados do auth.users. auth schema não fica exposto via PostgREST, então
      // usamos o Admin API para varrer os usuários.
      try {
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fallback = (list?.users ?? []).find((u: any) => {
          const meta = u.user_metadata ?? {}
          if (meta.account_type !== 'owner') return false
          return (String(meta.document ?? '')).replace(/\D/g, '') === clean
        })
        if (fallback?.email) return NextResponse.json({ email: fallback.email })
      } catch { /* Admin API indisponível — cai no erro genérico */ }

      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
    }

    if (type === 'cref') {
      if (!validateCREF(identifier)) {
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
      }

      const cref = identifier.trim().toUpperCase()
      const normalized = normalizeCREF(cref)

      // Caminho principal: profiles.cref (populado pelo trigger handle_new_user).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileRows } = await (admin as any)
        .from('profiles')
        .select('email, cref')
        .eq('cref', cref)
        .not('email', 'is', null)
        .limit(1)

      if (profileRows?.[0]?.email) return NextResponse.json({ email: profileRows[0].email })

      // Fallback: Admin API — casa pelo metadata (account_type personal + CREF normalizado).
      try {
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const match = (list?.users ?? []).find((u: any) => {
          const meta = u.user_metadata ?? {}
          if (meta.account_type !== 'personal') return false
          return normalizeCREF(String(meta.document ?? '')) === normalized
        })
        if (match?.email) return NextResponse.json({ email: match.email })
      } catch { /* Admin API indisponível — cai no erro genérico */ }

      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
    }

    // type === 'cpf'
    if (!validateCPF(clean)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
    }

    // Caminho principal: profiles.cpf (populado pelo trigger handle_new_user).
    // O schema `auth` não é exposto ao PostgREST, então não dá pra consultar
    // auth.users direto pelo client — usamos a tabela public.profiles.
    const masked = clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileRows } = await (admin as any)
      .from('profiles')
      .select('email, cpf')
      .in('cpf', [clean, masked])
      .not('email', 'is', null)
      .limit(1)

    if (profileRows?.[0]?.email) return NextResponse.json({ email: profileRows[0].email })

    // Fallback: Admin API — varre usuários e casa pelo metadata (digits ou máscara).
    try {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match = (list?.users ?? []).find((u: any) => {
        const meta = u.user_metadata ?? {}
        if (meta.account_type !== 'personal') return false
        const doc = String(meta.document ?? '').replace(/\D/g, '')
        return doc === clean
      })
      if (match?.email) return NextResponse.json({ email: match.email })
    } catch { /* Admin API indisponível — cai no erro genérico */ }

    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }
}

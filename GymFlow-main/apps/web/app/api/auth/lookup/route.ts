import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/server'
import { validateCNPJ, validateCPF } from '@/lib/cnpj'
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

      // Fallback: cadastros antigos podem ter o CNPJ apenas em raw_user_meta_data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fallback } = await (admin as any)
        .schema('auth')
        .from('users')
        .select('email')
        .filter('raw_user_meta_data->>document', 'eq', clean)
        .filter('raw_user_meta_data->>account_type', 'eq', 'owner')
        .single()

      if (fallback?.email) return NextResponse.json({ email: fallback.email })

      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
    }

    // type === 'cpf'
    if (!validateCPF(clean)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .schema('auth')
      .from('users')
      .select('email')
      .filter('raw_user_meta_data->>document', 'eq', clean)
      .filter('raw_user_meta_data->>account_type', 'eq', 'personal')
      .single()

    if (data?.email) return NextResponse.json({ email: data.email })

    // Fallback: CPF antigo gravado com máscara
    const masked = clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fallback } = await (admin as any)
      .schema('auth')
      .from('users')
      .select('email')
      .filter('raw_user_meta_data->>document', 'eq', masked)
      .filter('raw_user_meta_data->>account_type', 'eq', 'personal')
      .single()

    if (fallback?.email) return NextResponse.json({ email: fallback.email })

    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }
}

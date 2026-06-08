import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/server'
import { validateCNPJ, validateCREF, normalizeCREF } from '@/lib/cnpj'
import { limiters } from '@/lib/rate-limit'
import { clientIp } from '@/lib/turnstile'

/**
 * Pre-check usado no /cadastro: dado um CNPJ ou CREF, retorna se já
 * existe uma conta vinculada (academias.cnpj OU user_metadata.document).
 * Retorna 200 com { exists: bool, masked_email?: string }.
 *
 * Diferente do /api/auth/lookup, NÃO requer Turnstile (cadastro ainda
 * não rendeu o widget) — protegemos com rate limit por IP. Email é
 * sempre retornado mascarado pra evitar enumeração casual.
 */
export async function POST(request: Request) {
  const ip = clientIp(request)
  const { success: rlOk } = await limiters.auth.limit(`check-document:${ip}`)
  if (!rlOk) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 })
  }

  let body: { document?: string; type?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { document, type } = body
  if (!document || !type) {
    return NextResponse.json({ error: 'document e type obrigatórios' }, { status: 400 })
  }

  const clean = type === 'cref' ? document.trim().toUpperCase() : document.replace(/\D/g, '')

  if (type === 'cnpj' && !validateCNPJ(clean)) {
    return NextResponse.json({ exists: false }, { status: 200 })
  }
  if (type === 'cref' && !validateCREF(clean)) {
    return NextResponse.json({ exists: false }, { status: 200 })
  }

  const admin = await createAdminClient()

  try {
    if (type === 'cnpj') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: academy } = await (admin as any)
        .from('academies')
        .select('owner_id')
        .eq('cnpj', clean)
        .maybeSingle()

      if (academy?.owner_id) {
        const { data: { user } } = await admin.auth.admin.getUserById(academy.owner_id)
        return NextResponse.json({ exists: true, masked_email: maskEmail(user?.email ?? null) })
      }

      // Fallback: CNPJ em metadata de algum user (orfão, ou que ainda não criou academia)
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match = (list?.users ?? []).find((u: any) => {
        const meta = u.user_metadata ?? {}
        if (meta.account_type !== 'owner') return false
        return String(meta.document ?? '').replace(/\D/g, '') === clean
      })
      if (match?.email) {
        return NextResponse.json({ exists: true, masked_email: maskEmail(match.email) })
      }

      return NextResponse.json({ exists: false })
    }

    if (type === 'cref') {
      const normalized = normalizeCREF(clean)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileRows } = await (admin as any)
        .from('profiles')
        .select('email, cref')
        .eq('cref', clean)
        .not('email', 'is', null)
        .limit(1)

      if (profileRows?.[0]?.email) {
        return NextResponse.json({ exists: true, masked_email: maskEmail(profileRows[0].email) })
      }

      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match = (list?.users ?? []).find((u: any) => {
        const meta = u.user_metadata ?? {}
        if (meta.account_type !== 'personal') return false
        return normalizeCREF(String(meta.document ?? '')) === normalized
      })
      if (match?.email) {
        return NextResponse.json({ exists: true, masked_email: maskEmail(match.email) })
      }

      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ error: 'type inválido' }, { status: 400 })
  } catch (err) {
    console.error('[check-document] erro', err)
    return NextResponse.json({ exists: false })
  }
}

function maskEmail(email: string | null): string | null {
  if (!email) return null
  const [local, domain] = email.split('@')
  if (!local || !domain) return null
  const visible = local.slice(0, 2)
  const hidden  = '*'.repeat(Math.max(2, local.length - 2))
  return `${visible}${hidden}@${domain}`
}

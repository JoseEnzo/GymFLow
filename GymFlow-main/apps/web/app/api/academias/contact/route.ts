import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

import { clientIp, verifyTurnstileToken } from '@/lib/turnstile'
import { rateLimit, tooManyRequests, RATE_LIMITS } from '@/lib/rate-limit'

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

export async function POST(request: Request) {
  const ip = clientIp(request)

  // Form público — limita por IP contra spam de leads.
  const rl = rateLimit(`academy-contact:${ip}`, RATE_LIMITS.invite)
  if (!rl.success) return tooManyRequests(rl.retryAfterSec)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  // Turnstile (4ª camada de segurança em rota pública).
  const ok = await verifyTurnstileToken(String(body['turnstileToken'] ?? ''), ip)
  if (!ok) {
    return NextResponse.json({ error: 'Verificação anti-bot falhou. Tente de novo.' }, { status: 403 })
  }

  const academyId = clean(body['academyId'], 64)
  const name = clean(body['name'], 120)
  const email = clean(body['email'], 160)
  const phone = clean(body['phone'], 40)
  const message = clean(body['message'], 1000)

  if (!academyId) {
    return NextResponse.json({ error: 'Academia não informada' }, { status: 400 })
  }
  if (!email && !phone) {
    return NextResponse.json({ error: 'Informe um e-mail ou telefone para contato' }, { status: 400 })
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }

  // Garante que a academia existe (FK também cobre, mas erro claro é melhor UX).
  const { data: academy } = await admin
    .from('academies')
    .select('id')
    .eq('id', academyId)
    .single()

  if (!academy) {
    return NextResponse.json({ error: 'Academia não encontrada' }, { status: 404 })
  }

  const { error } = await admin.from('contact_requests').insert({
    academy_id: academyId,
    name,
    email,
    phone,
    message,
  })

  if (error) {
    return NextResponse.json({ error: 'Não foi possível enviar a solicitação' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

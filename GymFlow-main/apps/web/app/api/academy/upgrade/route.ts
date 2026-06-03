import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-guard'
import { createCheckoutSession } from '@/lib/stripe'

const admin = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  let body: { planId?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { planId } = body
  if (planId !== 'starter' && planId !== 'pro') {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: academy, error } = await (admin.from('academies') as any)
    .select('id, stripe_customer_id')
    .eq('owner_id', user.id)
    .single()

  if (error || !academy) {
    return NextResponse.json({ error: 'Academia não encontrada' }, { status: 404 })
  }

  const priceEnvKey = planId === 'pro' ? 'STRIPE_PRICE_PRO_MONTHLY' : 'STRIPE_PRICE_STARTER_MONTHLY'
  if (!process.env[priceEnvKey]) {
    return NextResponse.json({ error: `Variável ${priceEnvKey} não configurada. Adicione o Price ID do Stripe no Doppler.` }, { status: 500 })
  }

  const origin = request.headers.get('origin') ?? process.env['NEXT_PUBLIC_APP_URL'] ?? ''
  try {
    const session = await createCheckoutSession({
      academyId: academy.id,
      planId,
      customerId: academy.stripe_customer_id ?? undefined,
      successUrl: `${origin}/dashboard?plan_upgraded=1`,
      cancelUrl:  `${origin}/dashboard`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[academy/upgrade]', err)
    return NextResponse.json({ error: 'Erro ao processar upgrade' }, { status: 500 })
  }
}

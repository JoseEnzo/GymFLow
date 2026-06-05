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
  if (planId !== 'starter' && planId !== 'pro' && planId !== 'personal') {
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

  // Bypass do Stripe em dev/test — atualiza plan direto e retorna URL local.
  // Ver comentário em ../route.ts. Produção sempre passa por Stripe.
  const skipStripe =
    process.env.NODE_ENV !== 'production' || process.env['SKIP_STRIPE_CHECKOUT'] === 'true'

  if (skipStripe) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (admin.from('academies') as any)
      .update({ plan: planId })
      .eq('id', academy.id)
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    const origin = request.headers.get('origin') ?? process.env['NEXT_PUBLIC_APP_URL'] ?? ''
    return NextResponse.json({ url: `${origin}/dashboard?plan_upgraded=1` })
  }

  const priceEnvKey =
    planId === 'pro' ? 'STRIPE_PRICE_PRO_MONTHLY'
      : planId === 'personal' ? 'STRIPE_PRICE_PERSONAL_MONTHLY'
        : 'STRIPE_PRICE_STARTER_MONTHLY'
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

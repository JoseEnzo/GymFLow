import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import { guardRoute } from '@/lib/api-guard'
import { checkoutSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const result = await guardRoute(request, checkoutSchema)
  if (result instanceof NextResponse) return result
  const { user, body: { academyId, planId } } = result

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { data: member } = await supabase
    .from('academy_members')
    .select('role')
    .eq('academy_id', academyId)
    .eq('user_id', user.id)
    .single()

  if (!member || (member as { role: string }).role !== 'owner') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { data: academy } = await supabase
    .from('academies')
    .select('stripe_customer_id')
    .eq('id', academyId)
    .single()

  // Pré-check de config: sem essas vars no servidor (Vercel Production), o Stripe
  // quebra dentro do create() e o erro vira genérico. Avisar qual falta — mesmo
  // padrão da rota /api/academy/upgrade.
  const priceEnvKey =
    planId === 'pro' ? 'STRIPE_PRICE_PRO_MONTHLY'
    : planId === 'personal' ? 'STRIPE_PRICE_PERSONAL_MONTHLY'
    : 'STRIPE_PRICE_STARTER_MONTHLY'
  if (!process.env['STRIPE_SECRET_KEY']) {
    return NextResponse.json({ error: 'Pagamento indisponível: STRIPE_SECRET_KEY não configurada no servidor.' }, { status: 500 })
  }
  if (!process.env[priceEnvKey]) {
    return NextResponse.json({ error: `Pagamento indisponível: ${priceEnvKey} não configurada no servidor.` }, { status: 500 })
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

  try {
    const session = await createCheckoutSession({
      academyId,
      planId,
      customerId: (academy as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? undefined,
      successUrl: `${origin}/configuracoes?tab=plano&success=1`,
      cancelUrl: `${origin}/configuracoes?tab=plano`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[billing/checkout]', err)
    // Mensagens de erro do Stripe são seguras (a API mascara a chave) e dizem a
    // causa real: "No such price", "Invalid API Key", mismatch test/live, etc.
    const detail = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento', detail }, { status: 500 })
  }
}

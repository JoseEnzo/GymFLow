import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

const PLAN_MAP: Record<string, 'starter' | 'pro'> = {
  [process.env['STRIPE_PRICE_STARTER_MONTHLY']!]: 'starter',
  [process.env['STRIPE_PRICE_PRO_MONTHLY']!]: 'pro',
}

const VALID_ACADEMY_PLANS = ['starter', 'pro'] as const
type AcademyPlan = (typeof VALID_ACADEMY_PLANS)[number]

function isAcademyPlan(value: unknown): value is AcademyPlan {
  return typeof value === 'string' && (VALID_ACADEMY_PLANS as readonly string[]).includes(value)
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env['STRIPE_WEBHOOK_SECRET']!
    )
  } catch {
    return NextResponse.json(
      { error: 'Assinatura do webhook inválida' },
      { status: 400 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any

  // Claim atômico: tenta inserir event_id. Se já existe (PK conflict, ignoreDuplicates),
  // o upsert não retorna row — sinal de que outro worker já processou.
  // Resolve a race do código antigo (SELECT + INSERT separados).
  const { data: claimed, error: claimError } = await supabase
    .from('stripe_processed_events')
    .upsert({ event_id: event.id }, { onConflict: 'event_id', ignoreDuplicates: true })
    .select('event_id')

  if (claimError) {
    console.error('[stripe webhook] claim failed:', claimError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!claimed || claimed.length === 0) {
    // Já processado por outro worker. Stripe não retenta com 200.
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Plano de academia
        const academyId = session.metadata?.['academyId']
        const planId    = session.metadata?.['planId']

        if (academyId && isAcademyPlan(planId)) {
          const { error: updateErr } = await supabase.from('academies').update({
            plan: planId,
            stripe_customer_id:     session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status:    'active',
          }).eq('id', academyId)
          if (updateErr) throw updateErr
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        const plan = priceId ? PLAN_MAP[priceId] : undefined

        const { error: updateErr } = await supabase.from('academies').update({
          subscription_status: sub.status as 'active' | 'canceled' | 'past_due' | 'trialing',
          ...(plan ? { plan } : {}),
        }).eq('stripe_subscription_id', sub.id)
        if (updateErr) throw updateErr
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const { error: updateErr } = await supabase.from('academies').update({
          plan: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        }).eq('stripe_subscription_id', sub.id)
        if (updateErr) throw updateErr
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const { error: updateErr } = await supabase.from('academies').update({
            subscription_status: 'past_due',
          }).eq('stripe_subscription_id', invoice.subscription as string)
          if (updateErr) throw updateErr
        }
        break
      }
    }
  } catch (err: unknown) {
    // Processamento falhou DEPOIS do claim. Libera o event_id pra Stripe poder
    // retentar — caso contrário, marcaríamos como processado um evento que não
    // teve seus side-effects aplicados (pagamento perdido).
    await supabase.from('stripe_processed_events').delete().eq('event_id', event.id)
    console.error('[stripe webhook] processing failed, rolled back:', err)
    return NextResponse.json({ error: 'Failed to process event' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

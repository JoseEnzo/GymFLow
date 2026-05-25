import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

const PLAN_MAP: Record<string, 'starter' | 'pro'> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY!]: 'starter',
  [process.env.STRIPE_PRICE_PRO_MONTHLY!]: 'pro',
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
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Webhook error: ${(err as Error).message}` },
      { status: 400 }
    )
  }

  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const academyId = session.metadata?.academyId
      const planId = session.metadata?.planId as 'starter' | 'pro' | undefined

      if (academyId && planId) {
        await supabase.from('academies').update({
          plan: planId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_status: 'active',
        }).eq('id', academyId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const academyId = sub.metadata?.academyId
      const priceId = sub.items.data[0]?.price.id
      const plan = priceId ? PLAN_MAP[priceId] : undefined

      if (academyId) {
        await supabase.from('academies').update({
          subscription_status: sub.status as 'active' | 'canceled' | 'past_due' | 'trialing',
          ...(plan ? { plan } : {}),
        }).eq('stripe_subscription_id', sub.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('academies').update({
        plan: 'free',
        subscription_status: 'canceled',
        stripe_subscription_id: null,
      }).eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await supabase.from('academies').update({
          subscription_status: 'past_due',
        }).eq('stripe_subscription_id', invoice.subscription as string)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

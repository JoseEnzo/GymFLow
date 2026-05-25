import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const PLANS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    name: 'Starter',
    price: 9900,
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    name: 'Pro',
    price: 19900,
  },
} as const

export async function createCheckoutSession({
  academyId,
  planId,
  customerId,
  successUrl,
  cancelUrl,
}: {
  academyId: string
  planId: 'starter' | 'pro'
  customerId?: string
  successUrl: string
  cancelUrl: string
}) {
  const plan = PLANS[planId]

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { academyId, planId },
    subscription_data: {
      metadata: { academyId },
      trial_period_days: 14,
    },
    locale: 'pt-BR',
  })

  return session
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId)
}

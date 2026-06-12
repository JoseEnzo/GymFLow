import Stripe from 'stripe'

let _stripe: Stripe | null = null
function getStripeClient(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return _stripe
}

// Lazy: o Stripe só é instanciado no primeiro acesso a uma propriedade (em
// runtime, dentro dos handlers). Sem isso, `new Stripe(undefined)` rodava no
// carregamento do módulo e quebrava o `next build` na fase "Collecting page
// data" quando STRIPE_SECRET_KEY não está definida (deploy sem Stripe +
// SKIP_STRIPE_CHECKOUT=true). Os call sites (`stripe.checkout...`) não mudam.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripeClient()
    const value = Reflect.get(client, prop)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export const PLANS = {
  starter: {
    priceId: process.env['STRIPE_PRICE_STARTER_MONTHLY']!,
    name: 'Starter',
    price: 19700,
  },
  pro: {
    priceId: process.env['STRIPE_PRICE_PRO_MONTHLY']!,
    name: 'Pro',
    price: 39700,
  },
  personal: {
    priceId: process.env['STRIPE_PRICE_PERSONAL_MONTHLY']!,
    name: 'Personal',
    price: 9700,
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
  planId: 'starter' | 'pro' | 'personal'
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
      ...(planId === 'starter' || planId === 'personal' ? { trial_period_days: 30 } : {}),
    },
    locale: 'pt-BR',
  })

  return session
}


export async function createFreeCheckoutSession({
  academyId,
  customerId,
  email,
  successUrl,
  cancelUrl,
}: {
  academyId: string
  customerId?: string
  email?: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    payment_method_types: ['card'],
    customer: customerId,
    customer_email: customerId ? undefined : email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { academyId, plan: 'free' },
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

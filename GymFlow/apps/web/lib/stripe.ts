import Stripe from 'stripe'

export const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

export const PLANS = {
  starter: {
    priceId: process.env['STRIPE_PRICE_STARTER_MONTHLY']!,
    name: 'Starter',
    price: 9900,
  },
  pro: {
    priceId: process.env['STRIPE_PRICE_PRO_MONTHLY']!,
    name: 'Pro',
    price: 19900,
  },
} as const

export const STUDENT_PLANS_STRIPE = {
  solo: {
    priceId: process.env['STRIPE_PRICE_SOLO_MONTHLY']!,
    name: 'Solo',
    price: 2900,
  },
  plus: {
    priceId: process.env['STRIPE_PRICE_PLUS_MONTHLY']!,
    name: 'Plus',
    price: 4900,
  },
  elite: {
    priceId: process.env['STRIPE_PRICE_ELITE_MONTHLY']!,
    name: 'Elite',
    price: 8900,
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
      ...(planId === 'starter' ? { trial_period_days: 30 } : {}),
    },
    locale: 'pt-BR',
  })

  return session
}

export async function createStudentCheckoutSession({
  userId,
  planId,
  customerId,
  successUrl,
  cancelUrl,
}: {
  userId: string
  planId: 'solo' | 'plus' | 'elite'
  customerId?: string
  successUrl: string
  cancelUrl: string
}) {
  const plan = STUDENT_PLANS_STRIPE[planId]

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, planId, type: 'student' },
    subscription_data: {
      metadata: { userId, planId, type: 'student' },
      trial_period_days: 14,
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

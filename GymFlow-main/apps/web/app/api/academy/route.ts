import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-guard'
import { createCheckoutSession, createFreeCheckoutSession } from '@/lib/stripe'

// Admin client (service role — bypassa RLS)
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  let body: { name?: string; plan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { name, plan = 'starter' } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  // Busca CNPJ armazenado no metadata do Supabase Auth durante o cadastro
  const { data: { user: fullUser } } = await admin.auth.admin.getUserById(user.id)
  const cnpj = (fullUser?.user_metadata?.['document'] ?? '').replace(/\D/g, '') || null

  const slug =
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Date.now().toString(36)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: academy, error: academyError } = await (admin.from('academies') as any).insert({
    owner_id: user.id,
    name: name.trim(),
    slug,
    plan,
    ...(cnpj ? { cnpj } : {}),
  }).select().single()

  if (academyError) {
    console.error('[academy] insert error:', academyError)
    if (academyError.code === '23505' && academyError.message.includes('cnpj')) {
      // Cleanup: deleta o auth.user que acabou de tentar criar academia.
      // Sem isso, o user fica órfão (CNPJ no metadata mas sem academia),
      // bloqueando todas as tentativas seguintes com o mesmo CNPJ.
      // O onboarding faz signOut depois disso — sessão dele já vai expirar.
      try {
        await admin.auth.admin.deleteUser(user.id)
      } catch (cleanupErr) {
        console.error('[academy] cleanup auth user falhou:', cleanupErr)
      }
      return NextResponse.json(
        { error: 'Este CNPJ já está cadastrado em outra academia. Faça login com o e-mail dessa conta.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: academyError.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: memberError } = await (admin.from('academy_members') as any).insert({
    academy_id: academy.id,
    user_id: user.id,
    role: 'owner',
    is_active: true,
  })

  if (memberError) {
    console.error('[academy] member insert error:', memberError)
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Bypass do Stripe em dev/test: cria academia, pula checkout e cai direto no /dashboard.
  // Ativa quando NODE_ENV !== 'production' OU env `SKIP_STRIPE_CHECKOUT=true` explicitamente.
  // Use só em ambiente de teste — em produção sempre cobra via Stripe.
  const skipStripe =
    process.env.NODE_ENV !== 'production' || process.env['SKIP_STRIPE_CHECKOUT'] === 'true'

  // Plano pago → gera checkout URL na mesma request (evita segundo roundtrip com RLS)
  if (!skipStripe && (plan === 'starter' || plan === 'pro' || plan === 'personal')) {
    const priceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}_MONTHLY`]
    if (!priceId) {
      console.error(`[academy] STRIPE_PRICE_${plan.toUpperCase()}_MONTHLY não configurado`)
      return NextResponse.json({ academy, stripeError: 'Plano não configurado no servidor' })
    }
    try {
      const session = await createCheckoutSession({
        academyId: academy.id,
        planId: plan as 'starter' | 'pro' | 'personal',
        successUrl: `${origin}/configuracoes?tab=plano&success=1`,
        cancelUrl:  `${origin}/configuracoes?tab=plano`,
      })
      return NextResponse.json({ academy, checkoutUrl: session.url })
    } catch (err) {
      console.error('[academy] stripe error:', err)
      return NextResponse.json({ academy, stripeError: 'Erro ao criar sessão de pagamento' })
    }
  }

  return NextResponse.json({ academy })
}

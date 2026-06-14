import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

import { stripe } from '@/lib/stripe'
import { requireAuth } from '@/lib/api-guard'

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Sincroniza o status de uma Checkout Session do Stripe diretamente com o banco,
// resolvendo a race condition entre o redirect de sucesso e o webhook chegar.
export async function GET(request: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const academyId = searchParams.get('academy_id')

  if (!sessionId || !academyId) {
    return NextResponse.json({ error: 'session_id e academy_id obrigatórios' }, { status: 400 })
  }

  // Confirma que o usuário é owner desta academia
  const { data: member } = await admin
    .from('academy_members')
    .select('role')
    .eq('academy_id', academyId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  // Só sincroniza se o pagamento realmente completou e o metadata bate com a academia
  if (session.status !== 'complete' || session.metadata?.['academyId'] !== academyId) {
    return NextResponse.json({ ready: false })
  }

  const plan = session.metadata?.['planId']
  if (!plan || !['starter', 'pro', 'personal'].includes(plan)) {
    return NextResponse.json({ ready: false })
  }

  // Status/trial reais do Stripe — starter/personal entram em 'trialing' (30 dias).
  // Sem isso o banco salvava 'active' + trial_ends_at null, e o aviso de fim de
  // trial nunca aparecia.
  let subStatus: 'active' | 'trialing' = 'active'
  let trialEndsAt: string | null = null
  if (session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string)
    subStatus = sub.status === 'trialing' ? 'trialing' : 'active'
    trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated } = await (admin as any)
    .from('academies')
    .update({
      plan,
      stripe_customer_id:     session.customer as string,
      stripe_subscription_id: session.subscription as string,
      subscription_status:    subStatus,
      trial_ends_at:          trialEndsAt,
    })
    .eq('id', academyId)
    .select()
    .single()

  return NextResponse.json({ ready: true, academy: updated })
}

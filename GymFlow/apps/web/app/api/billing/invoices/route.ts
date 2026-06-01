import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { limiters } from '@/lib/rate-limit'

const academyIdSchema = z.string().uuid('academyId inválido')

export async function GET(request: Request) {
  const supabaseRaw = await createClient()
  const { data: { user } } = await supabaseRaw.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { success } = await limiters.api.limit(user.id)
  if (!success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = academyIdSchema.safeParse(searchParams.get('academyId'))

  if (!parsed.success) {
    return NextResponse.json({ error: 'academyId inválido' }, { status: 400 })
  }

  const academyId = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = supabaseRaw as any

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
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', academyId)
    .single()

  const ac = academy as { stripe_customer_id: string | null; stripe_subscription_id: string | null } | null

  if (!ac?.stripe_customer_id) {
    return NextResponse.json({ invoices: [], periodEnd: null, trialEnd: null })
  }

  try {
    const [invoiceList, subscription] = await Promise.all([
      stripe.invoices.list({ customer: ac.stripe_customer_id, limit: 5 }),
      ac.stripe_subscription_id
        ? stripe.subscriptions.retrieve(ac.stripe_subscription_id)
        : null,
    ])

    const invoices = invoiceList.data.map((inv) => ({
      id: inv.id,
      date: inv.created,
      amount: inv.amount_paid,
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
    }))

    const periodEnd = subscription
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null

    const trialEnd = subscription?.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null

    return NextResponse.json({ invoices, periodEnd, trialEnd })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

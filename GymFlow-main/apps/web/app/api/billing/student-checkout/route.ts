import { NextResponse } from 'next/server'

import { createStudentCheckoutSession } from '@/lib/stripe'
import { guardRoute } from '@/lib/api-guard'
import { studentCheckoutSchema } from '@/lib/validations'

export async function POST(request: Request) {
  const result = await guardRoute(request, studentCheckoutSchema)
  if (result instanceof NextResponse) return result
  const { user, body: { planId } } = result

  const origin = request.headers.get('origin') ?? process.env['NEXT_PUBLIC_APP_URL'] ?? ''

  try {
    const session = await createStudentCheckoutSession({
      userId: user.id,
      planId,
      successUrl: `${origin}/dashboard?subscription=success&plan=${planId}`,
      cancelUrl:  `${origin}/onboarding?plan=${planId}`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[billing/student-checkout]', err)
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}

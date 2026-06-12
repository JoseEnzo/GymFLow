import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (next) return NextResponse.redirect(`${origin}${next}`)

      // Para OAuth (Google), verifica se o usuário já tem academia
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Vínculo de academia (qualquer role) manda direto pro dashboard — o role
        // efetivo vem de academy_members, não do account_type. Donos e personais reais
        // têm vínculo e saem por aqui; entram pelo /cadastro, nunca pelo OAuth.
        const { data: members } = await supabase
          .from('academy_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)

        if (members && members.length > 0) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        // Login social (Google) SEMPRE entra como aluno. Sem vínculo de academia,
        // força account_type: 'student' mesmo se já houver valor antigo (ex: e-mail
        // reusado de um cadastro personal/owner que nunca criou academia) — senão o
        // onboarding cairia na tela de personal/dono em vez de mandar pro dashboard.
        if (user.user_metadata?.['account_type'] !== 'student') {
          await supabase.auth.updateUser({ data: { account_type: 'student' } })
        }
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}

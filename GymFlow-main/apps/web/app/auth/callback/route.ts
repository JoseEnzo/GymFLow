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
        // Login social (Google) SEMPRE entra como aluno. Donos e personais passam
        // pelo /cadastro (com CNPJ/CREF/pagamento) — nunca pelo OAuth. O signup por
        // credenciais sempre grava account_type, então ausência aqui = 1º login social.
        // Sem isso o usuário cairia no seletor de papel do /onboarding e poderia virar
        // dono/personal sem academia configurada.
        if (!user.user_metadata?.['account_type']) {
          await supabase.auth.updateUser({ data: { account_type: 'student' } })
        }

        const { data: members } = await supabase
          .from('academy_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)

        if (members && members.length > 0) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}

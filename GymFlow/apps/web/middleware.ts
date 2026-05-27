import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { limiters } from '@/lib/rate-limit'

const PUBLIC_ROUTES = ['/', '/login', '/cadastro', '/convite', '/onboarding', '/recuperar-senha', '/redefinir-senha', '/codigo']
const AUTH_ROUTES = ['/login', '/cadastro', '/recuperar-senha']
const RATE_LIMITED_AUTH = ['/login', '/cadastro', '/recuperar-senha']

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Rate limiting: sempre ativo (Upstash em prod, in-memory em dev)
  const ip = getIp(request)

  if (RATE_LIMITED_AUTH.some((r) => path === r)) {
    const { success } = await limiters.auth.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
        { status: 429 }
      )
    }
  }

  if (path.startsWith('/convite/') && path.length > '/convite/'.length) {
    const { success } = await limiters.invite.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 }
      )
    }
  }

  if (path.startsWith('/api/') && !path.startsWith('/api/webhooks/')) {
    const userId = request.cookies.get('sb-access-token')?.value ?? ip
    const { success } = await limiters.api.limit(userId)
    if (!success) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido.' },
        { status: 429 }
      )
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = PUBLIC_ROUTES.some((r) => path === r || path.startsWith('/convite/'))
  const isAuthRoute = AUTH_ROUTES.includes(path)

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

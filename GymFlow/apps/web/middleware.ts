import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/cadastro', '/convite', '/onboarding', '/recuperar-senha', '/redefinir-senha', '/codigo', '/privacidade', '/termos']
const AUTH_ROUTES = ['/login', '/cadastro', '/recuperar-senha']

// Rotas de API chamadas por serviços externos (sem Origin header) — excluídas do CORS restritivo
const EXTERNAL_API_ROUTES = ['/api/webhooks/']

function applyCors(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/api/')) return null

  // Webhooks de terceiros chegam sem Origin — deixa passar
  if (EXTERNAL_API_ROUTES.some((r) => pathname.startsWith(r))) return null

  const origin = request.headers.get('origin')
  if (!origin) return null // Chamadas server-to-server sem Origin são OK

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? ''
  const isDev = process.env.NODE_ENV === 'development'

  const isAllowed =
    (appUrl && origin === appUrl) ||
    (isDev && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')))

  // Preflight OPTIONS — responde sem tocar no Supabase
  if (request.method === 'OPTIONS') {
    if (!isAllowed) return new NextResponse(null, { status: 403 })
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      },
    })
  }

  if (!isAllowed) {
    return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
  }

  return null // Origem válida — continua o fluxo normal
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // CORS — resposta antecipada para OPTIONS ou origem inválida
  const corsResponse = applyCors(request)
  if (corsResponse) return corsResponse

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = PUBLIC_ROUTES.some((r) => path === r || path.startsWith('/convite/')) || path.startsWith('/api/')
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
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}

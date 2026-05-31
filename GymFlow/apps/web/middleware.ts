import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/cadastro', '/convite', '/onboarding', '/recuperar-senha', '/redefinir-senha', '/codigo']
const AUTH_ROUTES = ['/login', '/cadastro', '/recuperar-senha']

// Derive cookie name from Supabase URL: sb-{project-ref}-auth-token
function hasSessionCookie(request: NextRequest): boolean {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? ''
  const ref = url.replace(/^https?:\/\//, '').split('.')[0]
  const base = `sb-${ref}-auth-token`
  return request.cookies.has(base) || request.cookies.has(`${base}.0`)
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const isPublic = PUBLIC_ROUTES.some((r) => path === r || path.startsWith('/convite/')) || path.startsWith('/api/')
  const isAuthRoute = AUTH_ROUTES.includes(path)

  // Non-auth public routes (/, /convite/*, /api/*): skip entirely
  if (isPublic && !isAuthRoute) {
    return NextResponse.next({ request })
  }

  // Fast path: no session cookie → user is definitely not logged in
  if (!hasSessionCookie(request)) {
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }
    // Auth route (login/cadastro) with no session → let through immediately
    return NextResponse.next({ request })
  }

  // Has session cookie → verify with Supabase (may need token refresh)
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

  const { data: { session } } = await supabase.auth.getSession()

  if (!session && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}

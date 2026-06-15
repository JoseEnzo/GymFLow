import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/cadastro', '/convite', '/onboarding', '/recuperar-senha', '/redefinir-senha', '/codigo', '/privacidade', '/termos', '/demo', '/academias']
const AUTH_ROUTES = ['/login', '/cadastro', '/recuperar-senha']

// Allowlist explícita de APIs públicas. Qualquer rota /api/* fora desta lista
// exige sessão — defesa em profundidade junto com guardRoute/requireAuth nos handlers.
// Adicionar aqui só rotas que são públicas por design (pré-login, webhooks, callbacks).
const PUBLIC_API_ROUTES = [
  '/api/auth/lookup',      // login: descobre email a partir de CPF/CNPJ
  '/api/turnstile',        // verificação CAPTCHA pré-login
  '/api/invites/lookup',   // preview público de convite
  '/api/webhooks/stripe',  // assinatura Stripe verifica autenticidade
  '/api/check-document',   // cadastro: pre-check de CNPJ/CREF já existente
  '/api/verify-cref',      // cadastro: verificação real do CREF no conselho regional
  '/api/academias/contact',// diretório público: visitante pede convite a uma academia
]

const PUBLIC_PREFIXES = [
  '/convite/',       // página de aceite de convite (token na URL)
  '/auth/callback',  // OAuth callback do Supabase
  '/api/cron/',      // Vercel Cron — autoriza via Bearer CRON_SECRET na própria rota
  '/academias/',     // diretório público: página de detalhe da academia (slug na URL)
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // getClaims() valida o JWT localmente via JWKS (chaves de assinatura assimétricas),
  // evitando um round-trip à Auth (GoTrue) em CADA request — o multiplicador direto
  // de carga sob concorrência. Se o projeto ainda usar o segredo HS256 legado, o
  // getClaims cai automaticamente para validação remota (mesma garantia do getUser).
  // A fronteira real de autorização continua sendo o RLS no banco; aqui só decidimos
  // redirect vs. 401. O getClaims passa por getSession() internamente, então o refresh
  // de token e a regravação de cookies (setAll acima) seguem funcionando.
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims ?? null

  const isApi = path.startsWith('/api/')
  const isPublic =
    PUBLIC_ROUTES.includes(path) ||
    PUBLIC_API_ROUTES.includes(path) ||
    PUBLIC_PREFIXES.some((p) => path.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.includes(path)

  if (!user && !isPublic) {
    // APIs respondem 401 JSON em vez de redirect (clientes fetch esperam JSON).
    if (isApi) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
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
    // Exclui asset routes do Next.js file-convention (icon/apple-icon/opengraph-image
     // são gerados por `app/{icon,apple-icon,opengraph-image}.tsx` e respondem em paths
     // sem extensão; sem isso o middleware redireciona pra /login e quebra favicon/OG).
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|icon$|apple-icon$|opengraph-image$|twitter-image$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}

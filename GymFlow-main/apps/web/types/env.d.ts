// Declara as variáveis NEXT_PUBLIC_* como propriedades nomeadas em ProcessEnv.
// Sem isto, `noPropertyAccessFromIndexSignature` (base.json) obriga a usar
// `process.env['X']` — e o Next.js só faz inlining de NEXT_PUBLIC_* no build
// quando o acesso é por notação de ponto (`process.env.X`). Com colchetes, o
// valor fica `undefined` no browser e na Edge middleware em produção (Vercel).
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL?: string
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
    readonly NEXT_PUBLIC_APP_URL?: string
    readonly NEXT_PUBLIC_SENTRY_DSN?: string
    readonly NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string
    readonly NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string
  }
}

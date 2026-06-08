import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import withPWAInit from '@ducanh2912/next-pwa'

const isDev = process.env.NODE_ENV === 'development'

// PWA / service worker.
// Rotas autenticadas (multi-tenant) JAMAIS podem servir resposta cacheada — usuário B
// veria dado do usuário A. Por isso APIs e páginas dinâmicas usam NetworkOnly.
// Cache agressivo só em assets estáticos.
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  // Em dev o SW interfere com hot reload e o Sentry; só habilita em prod.
  disable: isDev,
  cacheOnFrontEndNav: false,
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      { urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i, handler: 'NetworkOnly' },
      { urlPattern: /^https:\/\/api\.stripe\.com\/.*/i, handler: 'NetworkOnly' },
      { urlPattern: /\/api\/.*/i, handler: 'NetworkOnly' },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|avif)$/i,
        handler: 'CacheFirst',
        options: { cacheName: 'images', expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 } },
      },
      {
        urlPattern: /\.(?:js|css|woff2?)$/i,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'static-assets' },
      },
      // Shell HTML da execução de treino — pra abrir offline.
      // Os DADOS da ficha ficam em IndexedDB (lib/offline-store.ts); o HTML
      // aqui só serve o esqueleto 'use client' que hidrata de lá. Sem risco
      // de leakage cross-tenant: o HTML é o mesmo pra todo aluno, dados vêm
      // do client após auth + RLS.
      {
        urlPattern: /\/treinos\/executar\/.+/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'workout-shell',
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 12, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      // Lista de treinos também útil offline pra navegar pra ficha cacheada.
      {
        urlPattern: /\/treinos$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'workout-shell',
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 2, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
})

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data: blob:",
      "font-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://maps.googleapis.com${isDev ? ' http://localhost:54321 ws://localhost:54321' : ''}`,
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },
  // Silencia warnings "Critical dependency" do @opentelemetry/instrumentation e
  // require-in-the-middle (transitivas do @sentry/nextjs server-side). Elas usam
  // require() dinâmico que o webpack não analisa estaticamente — inofensivas.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings ?? []),
        { module: /@opentelemetry\/instrumentation/ },
        { module: /require-in-the-middle/ },
        { module: /import-in-the-middle/ },
      ]
    }
    return config
  },
}

// Em dev: pula o wrapper do Sentry (source maps + webpack plugin) — webpack fica
// significativamente mais rápido. Runtime ainda importa Sentry via sentry.{client,server,edge}.config.ts,
// mas com guard de DSN válido (placeholder não dispara init).
// Em build local fora de CI: pula upload de sourcemap pra evitar "Project not found"
// quando as credenciais do Doppler local não batem com algum projeto Sentry.
// CI=true em Vercel/GH Actions → upload normal.
const finalConfig = withPWA(nextConfig)
const isCI = !!process.env['CI']

export default isDev || !isCI
  ? finalConfig
  : withSentryConfig(finalConfig, {
      org: process.env['SENTRY_ORG'],
      project: process.env['SENTRY_PROJECT'],
      silent: !process.env['CI'],
      widenClientFileUpload: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      disableLogger: true,
      automaticVercelMonitors: true,
    })

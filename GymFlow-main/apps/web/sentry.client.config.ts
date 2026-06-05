import * as Sentry from '@sentry/nextjs'

// `.env.example` tem placeholder `https://...@sentry.io/...` (truthy mas inválido).
// Sentry.init explode com "Invalid Sentry Dsn" e derruba a página inteira em dev.
// Só inicia se DSN parecer real (hash hex + projeto numérico).
const dsn = process.env['NEXT_PUBLIC_SENTRY_DSN']
const isValidDsn = !!dsn && /^https:\/\/[a-f0-9]+@[^/]+\/\d+$/i.test(dsn)

if (isValidDsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.01,
    integrations: [Sentry.replayIntegration()],
    debug: false,
  })
}

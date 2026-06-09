import * as Sentry from '@sentry/nextjs'

// Ver comentário em sentry.client.config.ts — placeholder do `.env.example` quebra init.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
const isValidDsn = !!dsn && /^https:\/\/[a-f0-9]+@[^/]+\/\d+$/i.test(dsn)

if (isValidDsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    debug: false,
  })
}

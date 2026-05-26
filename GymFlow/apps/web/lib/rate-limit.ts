import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function createLimiters() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  const redis = Redis.fromEnv()

  return {
    // Login, cadastro, recuperar-senha: 5 tentativas por 15 min por IP
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'rl:auth',
      analytics: true,
    }),
    // Tokens de convite: 10 por 5 min por IP
    invite: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '5 m'),
      prefix: 'rl:invite',
      analytics: true,
    }),
    // Rotas de API autenticadas: 30 por min por usuário
    api: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      prefix: 'rl:api',
      analytics: true,
    }),
  }
}

export const limiters = createLimiters()

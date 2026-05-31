import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── In-memory fallback (sem Upstash) ─────────────────────────────────────────
// Garante proteção mesmo em dev ou quando variáveis não estão configuradas.
// Atenção: não escala horizontalmente — use Upstash em produção com múltiplos pods.
class InMemoryLimiter {
  private hits = new Map<string, number[]>()

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  async limit(key: string): Promise<{ success: boolean }> {
    const now = Date.now()
    const prev = this.hits.get(key) ?? []
    const recent = prev.filter((t) => t > now - this.windowMs)

    if (recent.length >= this.max) return { success: false }

    recent.push(now)
    this.hits.set(key, recent)

    // Limpeza preventiva para não vazar memória
    if (this.hits.size > 5000) {
      for (const [k, v] of this.hits) {
        if (v.every((t) => t <= now - this.windowMs)) this.hits.delete(k)
      }
    }

    return { success: true }
  }
}

// ── Upstash (produção) ────────────────────────────────────────────────────────
function createUpstashLimiters() {
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

// ── Exportação unificada ──────────────────────────────────────────────────────
// Sempre retorna um limiter válido — Upstash se configurado, in-memory se não.
const upstash = createUpstashLimiters()

export const limiters = upstash ?? {
  auth:   new InMemoryLimiter(5,  15 * 60 * 1000),  // 5/15min
  invite: new InMemoryLimiter(10,  5 * 60 * 1000),  // 10/5min
  api:    new InMemoryLimiter(30,       60 * 1000),  // 30/min
}

export const isUsingUpstash = upstash !== null

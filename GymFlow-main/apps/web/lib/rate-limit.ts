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
// Considera só envs com valor real — placeholders do .env.example (ex: "https://...upstash.io")
// passam num truthy check mas crasham em Redis.fromEnv(). Em prod, Doppler injeta o valor verdadeiro.
function hasValidUpstashEnv(): boolean {
  const url = process.env['UPSTASH_REDIS_REST_URL']
  const token = process.env['UPSTASH_REDIS_REST_TOKEN']
  if (!url || !token) return false
  if (url.includes('...') || token.includes('...')) return false
  return url.startsWith('https://')
}

function createUpstashLimiters() {
  if (!hasValidUpstashEnv()) {
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

// ── Upstash é OBRIGATÓRIO em produção ─────────────────────────────────────────
// O fallback in-memory NÃO escala horizontalmente: cada instância serverless da
// Vercel mantém seu próprio Map, então com N instâncias o limite efetivo vira N×
// mais frouxo — exatamente sob pico, quando a proteção (brute-force, abuso) mais
// importa. Em produção sem Upstash isso é uma misconfiguração.
//
// Escolha de design: NÃO derrubamos as rotas (throw no import quebraria login/
// cadastro/convite por uma var ausente — pior que limite degradado). Em vez disso
// emitimos um alerta FATAL no boot do módulo (Sentry + console.error), impossível
// de passar despercebido, e seguimos com o in-memory até a config ser corrigida.
if (!upstash && process.env.NODE_ENV === 'production') {
  const msg =
    'Rate limiter rodando SEM Upstash em produção: limites não escalam entre ' +
    'instâncias serverless (proteção enfraquecida sob carga). Configure ' +
    'UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.'
  // eslint-disable-next-line no-console
  console.error(`[rate-limit] ${msg}`)
  // captureMessage é no-op se o DSN do Sentry não estiver configurado.
  void import('@sentry/nextjs')
    .then((Sentry) => Sentry.captureMessage(msg, 'fatal'))
    .catch(() => {})
}

export const limiters = upstash ?? {
  auth:   new InMemoryLimiter(5,  15 * 60 * 1000),  // 5/15min
  invite: new InMemoryLimiter(10,  5 * 60 * 1000),  // 10/5min
  api:    new InMemoryLimiter(30,       60 * 1000),  // 30/min
}

export const isUsingUpstash = upstash !== null

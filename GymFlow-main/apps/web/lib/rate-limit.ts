// Rate limiting DESATIVADO a pedido (2026-06-09).
//
// As rotas continuam chamando `limiters.<auth|invite|api>.limit(key)`, mas o
// limiter agora é um no-op que SEMPRE libera (`{ success: true }`). Isso remove
// o "Muitas tentativas. Aguarde alguns minutos e tente novamente." de login,
// cadastro, lookup, convites e check-document — sem precisar tocar nas rotas.
//
// ⚠️ Sem rate limiting não há proteção de força-bruta nessas rotas públicas.
// Para reativar, restaure a versão anterior deste arquivo (Upstash + fallback
// in-memory) via `git log -- apps/web/lib/rate-limit.ts`.

type Limiter = { limit: (key: string) => Promise<{ success: boolean }> }

const allow: Limiter = {
  limit: async () => ({ success: true }),
}

export const limiters = {
  auth: allow,
  invite: allow,
  api: allow,
}

export const isUsingUpstash = false

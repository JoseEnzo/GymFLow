/**
 * Cache TTL via localStorage para listas globais (recipes, food_items,
 * exercises) que mudam raramente. Reduz queries Supabase repetidas a cada
 * visita das mesmas páginas.
 *
 * Trade-off de staleness: até `ttlMs` o usuário pode ver um item antigo
 * (ex: receita criada por outro personal demora até 5min pra aparecer).
 * Pra invalidar manualmente após uma escrita local, chame `setCached` com
 * o array atualizado ou `invalidateCache(key)`.
 *
 * Versão no prefix → bump quando o shape dos dados mudar (campos
 * adicionados em migration) pra evitar parsear payload antigo.
 *
 * Cuidado multi-tenant: cache é por aba de browser. Se um aluno e um owner
 * usam o mesmo device, cada um vê o cache do próprio papel — sem leakage
 * cross-tenant porque a query Supabase já filtra por academy_id, e o cache
 * só guarda o resultado dessa query filtrada. Mas use sempre cache keys
 * que incluam o academy_id quando os dados variam por tenant.
 */

const CACHE_VERSION = 'v1'
const KEY_PREFIX    = `meutrein_cache_${CACHE_VERSION}_`

interface CacheEntry<T> {
  data: T
  storedAt: number
}

export function getCached<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (typeof entry?.storedAt !== 'number') return null
    if (Date.now() - entry.storedAt > ttlMs) return null
    return entry.data
  } catch {
    return null
  }
}

export function setCached<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CacheEntry<T> = { data, storedAt: Date.now() }
    window.localStorage.setItem(KEY_PREFIX + key, JSON.stringify(entry))
  } catch {
    // localStorage cheio ou bloqueado — fail silently, cache é otimização
  }
}

export function invalidateCache(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY_PREFIX + key)
  } catch {
    // ignore
  }
}

export const CACHE_TTL = {
  /** Listas globais raramente alteradas (receitas, exercícios, ingredientes) */
  GLOBAL_LIST: 5 * 60 * 1000,
} as const

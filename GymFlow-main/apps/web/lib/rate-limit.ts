import { NextResponse } from 'next/server'

/**
 * Rate limiter in-memory (janela fixa), por instância serverless.
 *
 * Suficiente pro volume de 1ª academia. **Limitação conhecida:** cada função da
 * Vercel mantém seu próprio Map, então sob escala horizontal o limite efetivo é
 * N× mais frouxo (N = nº de instâncias quentes). Pra rate limit distribuído de
 * verdade, trocar por Upstash Redis (a interface `rateLimit()` foi desenhada pra
 * ser drop-in). Pro primeiro cliente, in-memory já corta abuso trivial.
 *
 * Substitui o limiter Upstash removido — reabre a proteção de auth/convite/email
 * sem reintroduzir a dependência externa.
 */

export interface RateLimitRule {
  /** Máximo de requests permitidos na janela. */
  limit: number
  /** Tamanho da janela em ms. */
  windowMs: number
}

// Regras nomeadas. Folgadas o bastante pra não travar uso legítimo (lição do
// histórico: limites de 5/15min bloqueavam usuários reais — ver CLAUDE.md).
export const RATE_LIMITS = {
  auth:          { limit: 20, windowMs: 15 * 60_000 }, // login / lookup de credencial
  invite:        { limit: 30, windowMs: 5 * 60_000 },  // criar / aceitar / consultar convite
  checkDocument: { limit: 15, windowMs: 5 * 60_000 },  // pre-check de CNPJ/CREF no cadastro
  sendEmail:     { limit: 5,  windowMs: 10 * 60_000 }, // envio de email (protege quota Resend)
} satisfies Record<string, RateLimitRule>

interface WindowState {
  count: number
  resetAt: number
}

const store = new Map<string, WindowState>()
let lastSweep = Date.now()
const SWEEP_INTERVAL_MS = 5 * 60_000

// Remove janelas expiradas pra o Map não crescer sem limite numa instância de
// vida longa. Barato: roda no máximo a cada SWEEP_INTERVAL_MS.
function maybeSweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, state] of store) {
    if (state.resetAt <= now) store.delete(key)
  }
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  /** Segundos até a janela resetar (0 quando success). */
  retryAfterSec: number
}

export function rateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now()
  maybeSweep(now)

  const existing = store.get(key)
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + rule.windowMs })
    return { success: true, remaining: rule.limit - 1, retryAfterSec: 0 }
  }

  if (existing.count >= rule.limit) {
    return { success: false, remaining: 0, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) }
  }

  existing.count++
  return { success: true, remaining: rule.limit - existing.count, retryAfterSec: 0 }
}

/** Resposta 429 padrão com header Retry-After. */
export function tooManyRequests(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: 'Muitas tentativas. Aguarde um momento e tente de novo.' },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, retryAfterSec)) } },
  )
}

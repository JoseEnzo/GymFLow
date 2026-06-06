/**
 * Zod schemas centralizados para todas as rotas de API.
 * Nunca use cast direto (body as {...}) — sempre parse aqui.
 */
import { z } from 'zod'

// ── Billing ──────────────────────────────────────────────────────────────────

export const checkoutSchema = z.object({
  academyId: z.string().uuid('academyId inválido'),
  planId: z.enum(['starter', 'pro'], { message: 'planId deve ser starter ou pro' }),
})

export const portalSchema = z.object({
  academyId: z.string().uuid('academyId inválido'),
})

// ── Upload ───────────────────────────────────────────────────────────────────

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB

// ── Turnstile ────────────────────────────────────────────────────────────────

// Token sem min: a verificação real é server-side via verifyTurnstileToken,
// que rejeita vazio quando TURNSTILE_SECRET_KEY está set (prod) e libera em dev.
export const turnstileVerifySchema = z.object({
  token: z.string().max(2048),
})

// ── Auth lookup ──────────────────────────────────────────────────────────────

export const lookupSchema = z.object({
  identifier: z.string().min(1).max(20),
  type: z.enum(['cnpj', 'cpf', 'cref']),
  token: z.string().max(2048),
})

// ── Invite ───────────────────────────────────────────────────────────────────

export const createInviteSchema = z.object({
  academyId: z.string().uuid(),
  role: z.enum(['student', 'personal']),
  expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
  multiUse: z.boolean().optional().default(false),
})

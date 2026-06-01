import { createAdminClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'account.delete'
  | 'account.export'
  | 'avatar.upload'
  | 'billing.checkout'
  | 'billing.portal'

/**
 * Fire-and-forget: escreve um evento de auditoria sem bloquear a resposta principal.
 * Nunca lança exceção — falhas de log não devem afetar o usuário.
 */
export function writeAuditLog(
  userId: string,
  action: AuditAction,
  opts: { ip?: string; metadata?: Record<string, unknown> } = {},
): void {
  void (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = await createAdminClient() as any
      await admin.from('audit_logs').insert({
        user_id: userId,
        action,
        ip_address: opts.ip ?? null,
        metadata: opts.metadata ?? {},
      })
    } catch {
      // Silencioso: log não deve quebrar fluxo principal
    }
  })()
}

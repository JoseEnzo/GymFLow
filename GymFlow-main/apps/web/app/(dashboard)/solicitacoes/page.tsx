'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Inbox, Mail, Phone, MessageSquare, Check, Clock } from 'lucide-react'

import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ContactRequest {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  message: string | null
  status: string
  created_at: string
}

function whatsappHref(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.length <= 11) digits = `55${digits}`
  return `https://wa.me/${digits}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function SolicitacoesPage() {
  const { currentAcademy } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'new' | 'all'>('new')

  useEffect(() => {
    if (!currentAcademy) { setLoading(false); return }
    let alive = true
    ;(async () => {
      // Tabela contact_requests ainda não está no types.ts (aplicar migration 075 + db:types).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data, error } = await sb
        .from('contact_requests')
        .select('id, name, email, phone, message, status, created_at')
        .eq('academy_id', currentAcademy.id)
        .order('created_at', { ascending: false })
      if (!alive) return
      if (!error && data) setRequests(data as ContactRequest[])
      setLoading(false)
    })()
    return () => { alive = false }
  }, [currentAcademy, supabase])

  async function markHandled(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { error } = await sb
      .from('contact_requests')
      .update({ status: 'handled' })
      .eq('id', id)
    if (!error) {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'handled' } : r)))
    }
  }

  const visible = requests.filter((r) => (filter === 'new' ? r.status === 'new' : true))
  const newCount = requests.filter((r) => r.status === 'new').length

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-display font-extrabold">
          <Inbox className="h-6 w-6 text-brand-400" />
          Solicitações de contato
        </h1>
        <p className="text-sm text-muted-foreground">
          Pessoas que pediram um convite pela página pública da sua academia. Entre em contato e envie o convite de aluno.
        </p>
      </div>

      {/* filtro */}
      <div className="inline-flex rounded-xl border border-border/60 bg-surface-100 p-1">
        {([['new', `Novas${newCount ? ` (${newCount})` : ''}`], ['all', 'Todas']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-semibold transition-all',
              filter === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-card/50" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card/40 p-12 text-center">
          <Inbox className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
          <p className="font-semibold">
            {filter === 'new' ? 'Nenhuma solicitação nova' : 'Nenhuma solicitação ainda'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Os pedidos feitos em /academias aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-2xl border bg-card/60 p-5',
                r.status === 'new' ? 'border-brand-500/30' : 'border-border/50 opacity-75'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{r.name || 'Sem nome'}</p>
                    {r.status === 'new' ? (
                      <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-300">
                        Nova
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                        <Check className="h-3 w-3" /> Resolvida
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                    {r.email && (
                      <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-brand-400">
                        <Mail className="h-3.5 w-3.5" />
                        {r.email}
                      </a>
                    )}
                    {r.phone && (
                      <a href={whatsappHref(r.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-emerald-400">
                        <Phone className="h-3.5 w-3.5" />
                        {r.phone}
                      </a>
                    )}
                  </div>

                  {r.message && (
                    <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      <span>{r.message}</span>
                    </p>
                  )}

                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                    <Clock className="h-3 w-3" />
                    {formatDate(r.created_at)}
                  </p>
                </div>

                {r.status === 'new' && (
                  <button
                    onClick={() => markHandled(r.id)}
                    className="flex-shrink-0 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
                  >
                    Marcar resolvida
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

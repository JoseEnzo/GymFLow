'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell, UserPlus, Copy, Loader2, Users, Link2,
  MoreVertical, Trash2, ShieldOff, Clock, CheckCircle2,
  RefreshCw, AlertCircle, Search, Filter,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn, formatRelativeDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

// ── Types ───────────────────────────────────────────────────
interface Personal {
  memberId: string
  userId: string
  fullName: string | null
  joinedAt: string | null
  isActive: boolean
  sheetsCount: number
  studentsCount: number
}

interface PendingInvite {
  id: string
  code: string
  token: string
  createdAt: string
  expiresAt: string | null
  usesCount: number
  usesLimit: number | null
  isActive: boolean
}

// ── Helpers ─────────────────────────────────────────────────
function getInitials(name: string | null) {
  if (!name) return 'P'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#EC4899']
function avatarColor(name: string | null) {
  return COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length]!
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

function isExhausted(usesCount: number, usesLimit: number | null) {
  if (!usesLimit) return false
  return usesCount >= usesLimit
}

// ── Painel de convite ────────────────────────────────────────
function InvitePanel({
  academyId,
  onCreated,
  onClose,
}: {
  academyId: string
  onCreated: (invite: PendingInvite) => void
  onClose: () => void
}) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle')
  const [invite, setInvite] = useState<PendingInvite | null>(null)
  const [expiry, setExpiry] = useState<'7d' | '30d' | 'never'>('7d')
  const [multiUse, setMultiUse] = useState(false)

  async function generate() {
    setStatus('generating')
    try {
      let expiresAt: string | null = null
      if (expiry === '7d') expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString()
      if (expiry === '30d') expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString()

      const res = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId, role: 'personal', expiresAt, usesLimit: multiUse ? null : 1 }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Erro ao gerar convite')
      }
      const data = await res.json() as { code: string; token: string; expiresAt: string | null; usesLimit: number | null }

      const created: PendingInvite = {
        id: crypto.randomUUID(),
        code: data.code,
        token: data.token,
        createdAt: new Date().toISOString(),
        expiresAt: data.expiresAt,
        usesCount: 0,
        usesLimit: data.usesLimit,
        isActive: true,
      }
      setInvite(created)
      setStatus('done')
      onCreated(created)
      toast.success('Convite gerado!')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao gerar convite.')
      setStatus('idle')
    }
  }

  const link = invite ? `${window.location.origin}/convite/${invite.token}` : ''

  if (status === 'done' && invite) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 border border-brand-500/20 shadow-glow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <p className="text-sm font-semibold">Convite de personal gerado!</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">Fechar</button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Código de acesso</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono font-black text-2xl text-center tracking-[0.3em] py-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300">
              {invite.code}
            </div>
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(invite.code); toast.success('Código copiado!') }
                catch { toast.error('Não foi possível copiar — copie manualmente.') }
              }}
              className="p-3 rounded-xl border border-border/60 hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="divider" />

        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Link de convite</p>
          <div className="flex items-center gap-2">
            <input readOnly value={link} className="field text-xs flex-1" />
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(link); toast.success('Link copiado!') }
                catch { toast.error('Não foi possível copiar — copie manualmente.') }
              }}
              className="p-3 rounded-xl border border-border/60 hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {invite.expiresAt
            ? `Expira em ${new Date(invite.expiresAt).toLocaleDateString('pt-BR')}`
            : 'Sem validade definida'}
          {invite.usesLimit === 1 && ' · Uso único'}
          {!invite.usesLimit && ' · Usos ilimitados'}
        </div>

        <button
          onClick={() => { setStatus('idle'); setInvite(null) }}
          className="text-xs text-brand-400 hover:underline"
        >
          Gerar outro convite
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-brand-500/20 shadow-glow-sm space-y-5"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-brand-400" />
        </div>
        <div>
          <p className="font-display font-bold text-sm">Gerar link de convite</p>
          <p className="text-xs text-muted-foreground">Compartilhe com o personal trainer</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Validade do convite</p>
        <div className="flex gap-2">
          {([
            { value: '7d', label: '7 dias' },
            { value: '30d', label: '30 dias' },
            { value: 'never', label: 'Sem validade' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setExpiry(value)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium border transition-all',
                expiry === value
                  ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
                  : 'border-border/60 text-muted-foreground hover:bg-surface-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between glass rounded-xl p-3">
        <div>
          <p className="text-sm font-medium">Usos ilimitados</p>
          <p className="text-xs text-muted-foreground">Padrão: uso único por personal</p>
        </div>
        <button
          onClick={() => setMultiUse(!multiUse)}
          className={cn('relative rounded-full transition-all duration-300 flex-shrink-0', multiUse ? 'bg-brand-500' : 'bg-surface-300')}
          style={{ width: '2.5rem', height: '1.375rem' }}
        >
          <span
            className={cn('absolute top-0.5 rounded-full bg-white shadow transition-all duration-300', multiUse ? 'left-5' : 'left-0.5')}
            style={{ width: '1.125rem', height: '1.125rem' }}
          />
        </button>
      </div>

      <button
        onClick={generate}
        disabled={status === 'generating'}
        className="btn-primary w-full py-3 rounded-xl text-sm font-semibold"
      >
        {status === 'generating' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            Gerar convite
          </>
        )}
      </button>
    </motion.div>
  )
}

// ── Card de personal ─────────────────────────────────────────
function PersonalCard({
  personal,
  onDeactivate,
}: {
  personal: Personal
  onDeactivate: (memberId: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const supabase = createClient()
  const color = avatarColor(personal.fullName)

  async function handleDeactivate() {
    setDeactivating(true)
    setMenuOpen(false)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deleted, error } = await (supabase as any)
        .from('academy_members')
        .delete()
        .eq('id', personal.memberId)
        .select('id')

      if (error) throw error
      if (!deleted || deleted.length === 0) throw new Error('Sem permissão para remover este personal.')
      toast.success(`${personal.fullName ?? 'Personal'} foi removido.`)
      onDeactivate(personal.memberId)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao remover personal.')
      setDeactivating(false)
    }
  }

  return (
    <motion.div variants={fadeUp}>
      <div className={cn(
        'glass rounded-2xl p-4 hover:border-brand-500/20 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-card-hover border',
        !personal.isActive && 'opacity-60'
      )}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
            >
              {getInitials(personal.fullName)}
            </div>
            {personal.isActive && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-50" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{personal.fullName ?? 'Personal'}</p>
              {!personal.isActive && (
                <span className="badge text-[10px] py-0.5 px-1.5 bg-surface-200 text-muted-foreground border-0">Inativo</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {personal.joinedAt ? `Entrou ${formatRelativeDate(personal.joinedAt)}` : 'Personal Trainer'}
            </p>
          </div>

          {/* Menu */}
          {personal.isActive && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
              >
                {deactivating
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <MoreVertical className="w-4 h-4" />
                }
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setMenuOpen(false)}
                      className="fixed inset-0 z-10"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 z-20 glass rounded-xl border border-border/60 shadow-lg overflow-hidden min-w-[160px]"
                    >
                      <button
                        onClick={handleDeactivate}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <ShieldOff className="w-4 h-4" />
                        Remover da academia
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40">
          <div className="text-center">
            <p className="font-bold text-sm">{personal.studentsCount}</p>
            <p className="text-[10px] text-muted-foreground">Alunos</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">{personal.sheetsCount}</p>
            <p className="text-[10px] text-muted-foreground">Fichas</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-sm text-emerald-400">
              {personal.isActive ? 'Ativo' : 'Inativo'}
            </p>
            <p className="text-[10px] text-muted-foreground">Status</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Card de convite pendente ─────────────────────────────────
function InviteCard({
  invite,
  onRevoke,
}: {
  invite: PendingInvite
  onRevoke: (id: string) => void
}) {
  const supabase = createClient()
  const [revoking, setRevoking] = useState(false)
  const expired = isExpired(invite.expiresAt)
  const exhausted = isExhausted(invite.usesCount, invite.usesLimit)
  const invalid = expired || exhausted || !invite.isActive
  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/convite/${invite.token}`

  async function revoke() {
    setRevoking(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('invites')
        .update({ is_active: false })
        .eq('id', invite.id)

      if (error) throw error
      toast.success('Convite revogado.')
      onRevoke(invite.id)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao revogar convite.')
      setRevoking(false)
    }
  }

  return (
    <motion.div variants={fadeUp}>
      <div className={cn(
        'glass rounded-xl p-4 border transition-all',
        invalid ? 'opacity-50 border-border/20' : 'border-border/40 hover:border-brand-500/20'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            invalid ? 'bg-surface-200' : 'bg-brand-500/10'
          )}>
            {invalid
              ? <AlertCircle className="w-4 h-4 text-muted-foreground/50" />
              : <Link2 className="w-4 h-4 text-brand-400" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-brand-300 tracking-wider">
                {invite.code}
              </span>
              {expired && <span className="badge text-[10px] py-0.5 px-1.5 bg-red-500/10 text-red-400 border-red-500/20">Expirado</span>}
              {exhausted && !expired && <span className="badge text-[10px] py-0.5 px-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">Esgotado</span>}
              {!invalid && <span className="badge text-[10px] py-0.5 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Ativo</span>}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {invite.expiresAt
                  ? `Expira ${new Date(invite.expiresAt).toLocaleDateString('pt-BR')}`
                  : 'Sem validade'}
              </span>
              {invite.usesLimit && (
                <span className="text-[11px] text-muted-foreground">
                  {invite.usesCount}/{invite.usesLimit} uso{invite.usesLimit !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!invalid && (
              <button
                onClick={async () => {
                  try { await navigator.clipboard.writeText(invite.code); toast.success('Código copiado!') }
                  catch { toast.error('Não foi possível copiar.') }
                }}
                className="p-2 rounded-lg border border-border/60 hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground"
                title="Copiar código"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            {!invalid && (
              <button
                onClick={async () => {
                  try { await navigator.clipboard.writeText(link); toast.success('Link copiado!') }
                  catch { toast.error('Não foi possível copiar.') }
                }}
                className="p-2 rounded-lg border border-border/60 hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground"
                title="Copiar link"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>
            )}
            {invite.isActive && !expired && !exhausted && (
              <button
                onClick={revoke}
                disabled={revoking}
                className="p-2 rounded-lg border border-border/60 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-muted-foreground hover:text-red-400"
                title="Revogar convite"
              >
                {revoking
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function PersonaisPage() {
  const { currentAcademy, currentRole } = useAuthStore()
  const supabase = createClient()

  const [personais, setPersonais] = useState<Personal[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [showRevoked, setShowRevoked] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const isOwner = currentRole === 'owner'

  const load = useCallback(async () => {
    if (!currentAcademy) { setLoading(false); return }
    setLoading(true)

    // Load personais members
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabase as any)
      .from('academy_members')
      .select('id, user_id, joined_at, is_active')
      .eq('academy_id', currentAcademy.id)
      .eq('role', 'personal')
      .eq('is_active', true)
      .order('joined_at', { ascending: false })

    const userIds: string[] = (members ?? []).map((m: { user_id: string }) => m.user_id)

    // Load profiles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profilesData } = userIds.length > 0
      ? await (supabase as any)
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)
      : { data: [] }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileMap: Record<string, string | null> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(profilesData ?? []).forEach((p: any) => { profileMap[p.id] = p.full_name ?? null })

    // Load sheet stats per personal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sheetsData } = userIds.length > 0
      ? await (supabase as any)
          .from('workout_sheets')
          .select('personal_id, student_id')
          .eq('academy_id', currentAcademy.id)
          .in('personal_id', userIds)
      : { data: [] }

    const sheetsCountMap: Record<string, number> = {}
    const studentsSetMap: Record<string, Set<string>> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(sheetsData ?? []).forEach((s: any) => {
      sheetsCountMap[s.personal_id] = (sheetsCountMap[s.personal_id] ?? 0) + 1
      if (!studentsSetMap[s.personal_id]) studentsSetMap[s.personal_id] = new Set()
      studentsSetMap[s.personal_id]!.add(s.student_id)
    })

    setPersonais(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (members ?? []).map((m: any) => ({
        memberId: m.id,
        userId: m.user_id,
        fullName: profileMap[m.user_id] ?? null,
        joinedAt: m.joined_at ?? null,
        isActive: m.is_active,
        sheetsCount: sheetsCountMap[m.user_id] ?? 0,
        studentsCount: studentsSetMap[m.user_id]?.size ?? 0,
      }))
    )

    // Load personal invites
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inviteData } = await (supabase as any)
      .from('invites')
      .select('id, code, token, created_at, expires_at, uses_count, uses_limit, is_active')
      .eq('academy_id', currentAcademy.id)
      .eq('role', 'personal')
      .order('created_at', { ascending: false })

    setInvites(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (inviteData ?? []).map((i: any) => ({
        id: i.id,
        code: i.code,
        token: i.token,
        createdAt: i.created_at,
        expiresAt: i.expires_at,
        usesCount: i.uses_count,
        usesLimit: i.uses_limit,
        isActive: i.is_active,
      }))
    )

    setLoading(false)
  }, [currentAcademy])

  useEffect(() => { load() }, [load])

  function handleDeactivate(memberId: string) {
    setPersonais((prev) =>
      prev.map((p) => p.memberId === memberId ? { ...p, isActive: false } : p)
    )
  }

  function handleRevoke(id: string) {
    setInvites((prev) =>
      prev.map((i) => i.id === id ? { ...i, isActive: false } : i)
    )
  }

  function handleInviteCreated(invite: PendingInvite) {
    setInvites((prev) => [invite, ...prev])
  }

  const filtered = personais.filter((p) => {
    const matchesSearch = !search || (p.fullName?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && p.isActive) ||
      (filter === 'inactive' && !p.isActive)
    return matchesSearch && matchesFilter
  })

  const activeInvites = invites.filter(
    (i) => i.isActive && !isExpired(i.expiresAt) && !isExhausted(i.usesCount, i.usesLimit)
  )
  const revokedInvites = invites.filter(
    (i) => !i.isActive || isExpired(i.expiresAt) || isExhausted(i.usesCount, i.usesLimit)
  )

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mb-4">
          <ShieldOff className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="font-semibold text-muted-foreground">Acesso restrito</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Somente o proprietário pode gerenciar personais.</p>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Personais</h2>
          <p className="section-subtitle mt-1">
            {loading
              ? 'Carregando...'
              : `${personais.filter((p) => p.isActive).length} ${personais.filter((p) => p.isActive).length !== 1 ? 'personais' : 'personal'} ativo${personais.filter((p) => p.isActive).length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {currentAcademy && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => load()}
              className="p-2.5 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowInvitePanel(!showInvitePanel)}
              className={cn(
                'btn-primary text-sm py-2.5 px-5 rounded-xl',
                showInvitePanel && 'opacity-70'
              )}
            >
              <UserPlus className="w-4 h-4" />
              Convidar personal
            </button>
          </div>
        )}
      </motion.div>

      {/* Painel de convite */}
      <AnimatePresence>
        {showInvitePanel && currentAcademy && (
          <motion.div
            key="invite-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <InvitePanel
              academyId={currentAcademy.id}
              onCreated={handleInviteCreated}
              onClose={() => setShowInvitePanel(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      )}

      {!loading && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* ── Coluna esquerda: personais ── */}
          <div className="space-y-4">

            {/* Filtros */}
            {(personais.length > 0 || filter !== 'all') && (
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar personais..."
                    className="field pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {(['all', 'active', 'inactive'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        'px-3.5 py-2 rounded-xl text-sm font-medium transition-all',
                        filter === f
                          ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20'
                          : 'text-muted-foreground hover:bg-surface-100 border border-transparent'
                      )}
                    >
                      {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Inativos'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Lista */}
            <motion.div variants={fadeUp} className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Personais
                  <span className="badge text-[10px] py-0.5 px-1.5 bg-surface-200 border-0 font-bold">{personais.length}</span>
                </p>
              </div>

              {personais.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center border border-dashed border-border/40">
                  <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-3">
                    <Dumbbell className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Nenhum personal ainda</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Gere um convite e compartilhe com seu personal trainer.
                  </p>
                  <button
                    onClick={() => setShowInvitePanel(true)}
                    className="btn-primary text-xs py-2 px-4 rounded-xl mt-4 inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Convidar agora
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10">
                  <p className="font-semibold text-muted-foreground">
                    {search ? 'Nenhum personal encontrado' : `Nenhum personal ${filter === 'active' ? 'ativo' : 'inativo'}`}
                  </p>
                  <button
                    onClick={() => { setSearch(''); setFilter('all') }}
                    className="text-sm text-brand-400 mt-2 hover:underline"
                  >
                    Ver todos os personais
                  </button>
                </div>
              ) : (
                <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filtered.map((p) => (
                    <PersonalCard key={p.memberId} personal={p} onDeactivate={handleDeactivate} />
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* ── Coluna direita: convites ── */}
          <motion.div variants={fadeUp} className="space-y-4">

            {/* Convites ativos */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5" />
                Convites ativos
                <span className="badge text-[10px] py-0.5 px-1.5 bg-surface-200 border-0 font-bold">{activeInvites.length}</span>
              </p>

              {activeInvites.length === 0 ? (
                <div className="glass rounded-xl p-4 border border-dashed border-border/40 text-center">
                  <p className="text-xs text-muted-foreground">Nenhum convite ativo</p>
                </div>
              ) : (
                <motion.div variants={stagger} className="space-y-2">
                  {activeInvites.map((inv) => (
                    <InviteCard key={inv.id} invite={inv} onRevoke={handleRevoke} />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Convites expirados/revogados */}
            {revokedInvites.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowRevoked(!showRevoked)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {showRevoked ? 'Ocultar' : 'Ver'} histórico de convites ({revokedInvites.length})
                </button>

                <AnimatePresence>
                  {showRevoked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <motion.div variants={stagger} className="space-y-2 pt-1">
                        {revokedInvites.map((inv) => (
                          <InviteCard key={inv.id} invite={inv} onRevoke={handleRevoke} />
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Info */}
            <div className="glass rounded-xl p-4 border border-border/30 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hierarquia</p>
              {[
                { label: 'Proprietário', desc: 'Gerencia academia, personais e plano', color: '#10B981' },
                { label: 'Personal Trainer', desc: 'Cria fichas e convida alunos', color: '#06B6D4' },
                { label: 'Aluno', desc: 'Executa treinos e acompanha evolução', color: '#6366F1' },
              ].map(({ label, desc, color }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                  <div>
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      )}
    </motion.div>
  )
}

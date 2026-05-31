'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell, UserPlus, Copy, Loader2, Users, Link2,
  MoreVertical, Trash2, ShieldOff, Clock, CheckCircle2,
  CalendarDays, Mail, Search, Filter,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn, formatRelativeDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { DeleteMemberModal } from '@/components/ui/delete-member-modal'

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
  email: string | null
  joinedAt: string | null
  isActive: boolean
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
  const supabase = createClient()
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle')
  const [invite, setInvite] = useState<PendingInvite | null>(null)
  const [expiry, setExpiry] = useState<'7d' | '30d' | 'never'>('7d')
  const [multiUse, setMultiUse] = useState(false)

  async function generate() {
    setStatus('generating')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const code = Array.from({ length: 6 }, () => SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]).join('')
      const token = crypto.randomUUID()

      let expiresAt: string | null = null
      if (expiry === '7d') expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString()
      if (expiry === '30d') expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('invites')
        .insert({
          academy_id: academyId,
          created_by: user.id,
          code,
          token,
          role: 'personal',
          expires_at: expiresAt,
          uses_limit: multiUse ? null : 1,
        })
        .select()
        .single()

      if (error) throw error

      const created: PendingInvite = {
        id: data.id,
        code: data.code,
        token: data.token,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        usesCount: 0,
        usesLimit: data.uses_limit,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <p className="font-display font-bold text-sm">Gerar link de convite</p>
            <p className="text-xs text-muted-foreground">Compartilhe com o personal trainer</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">Fechar</button>
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
  onDeleteClick,
}: {
  personal: Personal
  onDeleteClick: (personal: Personal) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const color = avatarColor(personal.fullName)

  return (
    <motion.div variants={fadeUp} className="relative group">
      <div className={cn(
        'glass rounded-2xl p-4 border transition-all duration-300',
        personal.isActive
          ? 'border-border/40 hover:border-brand-500/20 hover:-translate-y-0.5 hover:shadow-card-hover'
          : 'border-border/20 opacity-60'
      )}>
        <div className="flex items-start gap-3">
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

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{personal.fullName ?? 'Personal'}</p>
            {personal.email && (
              <p className="text-[10px] text-muted-foreground/60 truncate flex items-center gap-1 mt-0.5">
                <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                {personal.email}
              </p>
            )}
            {personal.isActive ? (
              <span className="badge text-[10px] py-0.5 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mt-1 inline-block">Ativo</span>
            ) : (
              <span className="badge text-[10px] py-0.5 px-1.5 bg-surface-200 text-muted-foreground border-0 mt-1 inline-block">Inativo</span>
            )}
          </div>
        </div>

        {personal.joinedAt && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            <CalendarDays className="w-3 h-3" />
            <span>Entrou {formatRelativeDate(personal.joinedAt)}</span>
          </div>
        )}
      </div>

      {personal.isActive && (
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v) }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            style={{ opacity: menuOpen ? 1 : undefined }}
            title="Opções"
          >
            <MoreVertical className="w-4 h-4" />
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
                  className="absolute right-0 top-full mt-1 z-20 glass rounded-xl border border-border/60 shadow-lg overflow-hidden min-w-[180px]"
                >
                  <button
                    onClick={() => { setMenuOpen(false); onDeleteClick(personal) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir personal
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
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
  const [deleteTarget, setDeleteTarget] = useState<Personal | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const isOwner = currentRole === 'owner'

  async function handleDeletePersonal(reason: string) {
    if (!deleteTarget || !currentAcademy) return
    const res = await fetch('/api/members/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: deleteTarget.userId,
        academyId: currentAcademy.id,
        reason,
        role: 'personal',
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error((data as { error?: string }).error ?? 'Erro ao excluir personal.')
      return
    }
    toast.success(`${deleteTarget.fullName ?? 'Personal'} foi excluído permanentemente.`)
    setPersonais((prev) => prev.filter((p) => p.userId !== deleteTarget.userId))
    setDeleteTarget(null)
  }

  const load = useCallback(async () => {
    if (!currentAcademy) { setLoading(false); return }
    setLoading(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabase as any)
      .from('academy_members')
      .select('id, user_id, joined_at, is_active')
      .eq('academy_id', currentAcademy.id)
      .eq('role', 'personal')
      .order('joined_at', { ascending: false })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memberList = (members ?? []) as any[]
    const userIds: string[] = memberList.map((m) => m.user_id).filter(Boolean)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profileMap: Record<string, { fullName: string | null; email: string | null }> = {}
    if (userIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, { fullName: p.full_name ?? null, email: p.email ?? null }]))
    }

    setPersonais(
      memberList.map((m) => ({
        memberId: m.id,
        userId: m.user_id,
        fullName: profileMap[m.user_id]?.fullName ?? null,
        email: profileMap[m.user_id]?.email ?? null,
        joinedAt: m.joined_at ?? null,
        isActive: m.is_active,
      }))
    )

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

  function handleInviteCreated(invite: PendingInvite) {
    setInvites((prev) => [invite, ...prev])
  }

  const activeInvites = invites.filter(
    (i) => i.isActive && !isExpired(i.expiresAt) && !isExhausted(i.usesCount, i.usesLimit)
  )

  const filtered = personais.filter((p) => {
    const matchesSearch = (p.fullName ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'active' ? p.isActive : !p.isActive)
    return matchesSearch && matchesFilter
  })

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
              : `${personais.length} ${personais.length === 1 ? 'personal' : 'personais'} · ${personais.filter((p) => p.isActive).length} ativo${personais.filter((p) => p.isActive).length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {currentAcademy && (
          <button
            onClick={() => setShowInvitePanel(!showInvitePanel)}
            className={cn('btn-primary text-sm py-2.5 px-5 rounded-xl', showInvitePanel && 'opacity-70')}
          >
            <UserPlus className="w-4 h-4" />
            Convidar personal
          </button>
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

      {/* Convites ativos */}
      {activeInvites.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5" />
            Convites de personal ativos
          </p>
          <div className="space-y-2">
            {activeInvites.map((inv) => (
              <div key={inv.id} className="glass rounded-xl p-3 border border-border/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-4 h-4 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-mono font-bold text-sm text-brand-300 tracking-wider">{inv.code}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {inv.expiresAt ? `Expira ${new Date(inv.expiresAt).toLocaleDateString('pt-BR')}` : 'Sem validade'}
                    {inv.usesLimit ? ` · ${inv.usesCount}/${inv.usesLimit} uso${inv.usesLimit !== 1 ? 's' : ''}` : ' · Usos ilimitados'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const link = `${window.location.origin}/convite/${inv.token}`
                    try { await navigator.clipboard.writeText(link); toast.success('Link copiado!') }
                    catch { toast.error('Não foi possível copiar.') }
                  }}
                  className="p-2 rounded-lg border border-border/60 hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground flex-shrink-0"
                  title="Copiar link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filtros */}
      {personais.length > 0 && (
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

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <PersonalCard key={p.memberId} personal={p} onDeleteClick={setDeleteTarget} />
          ))}
        </motion.div>
      )}

      {/* Empty state — nenhum personal */}
      {!loading && personais.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-muted-foreground">Nenhum personal ainda</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Convide seus primeiros personais usando um link ou código de convite.
          </p>
          {currentAcademy && (
            <button
              onClick={() => setShowInvitePanel(true)}
              className="btn-primary text-sm py-2.5 px-5 rounded-xl mt-4 inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Convidar agora
            </button>
          )}
        </motion.div>
      )}

      {/* Sem resultado na busca */}
      {!loading && personais.length > 0 && filtered.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <p className="font-semibold text-muted-foreground">Nenhum personal encontrado</p>
          <button onClick={() => { setSearch(''); setFilter('all') }} className="text-sm text-brand-400 mt-2 hover:underline">
            Limpar filtros
          </button>
        </motion.div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteMemberModal
          name={deleteTarget.fullName}
          role="personal"
          onConfirm={handleDeletePersonal}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </motion.div>
  )
}

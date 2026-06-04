'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, UserPlus, Filter, Dumbbell, Flame,
  Clock, ChevronRight, Copy, Loader2, Users,
  Link2, CheckCircle2, ClipboardList, ShieldOff,
  AlertCircle, RefreshCw, Trash2, MoreVertical,
  UserX, CheckCheck, XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { cn, formatRelativeDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useDebounce } from '@/hooks/use-debounce'

const PAGE_SIZE = 50

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

// ── Types ────────────────────────────────────────────────────
interface Student {
  id: string
  full_name: string | null
  goal: string | null
  lastWorkout: string | null
  totalWorkouts: number
  activeSheets: number
  streak: number
  status: 'active' | 'inactive'
}

interface ExpulsionRequest {
  id: string
  studentId: string
  studentMemberId: string
  studentName: string | null
  requestedByName: string | null
  reason: string
  createdAt: string
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

// ── Helpers ──────────────────────────────────────────────────
function getInitials(name: string | null) {
  if (!name) return 'A'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

function isExhausted(usesCount: number, usesLimit: number | null) {
  if (!usesLimit) return false
  return usesCount >= usesLimit
}

// ── StudentCard ──────────────────────────────────────────────
function StudentCard({
  student,
  isPersonal,
  onExpel,
}: {
  student: Student
  isPersonal?: boolean
  onExpel?: (student: Student) => void
}) {
  const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#EC4899']
  const color = colors[(student.full_name?.charCodeAt(0) ?? 0) % colors.length]!;
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.div variants={fadeUp}>
      <div className="glass rounded-2xl p-4 hover:border-brand-500/20 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-card-hover">
        <div className="relative">
          {/* menu de ação */}
          {onExpel && student.status === 'active' && (
            <div className="absolute top-0 right-0 z-10">
              <button
                onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v) }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setMenuOpen(false)}
                      className="fixed inset-0 z-10"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 z-20 glass rounded-xl border border-border/60 shadow-lg overflow-hidden min-w-[170px]"
                    >
                      <button
                        onClick={() => { setMenuOpen(false); onExpel(student) }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <UserX className="w-4 h-4" />
                        {isPersonal ? 'Solicitar remoção' : 'Remover aluno'}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        <Link href={`/alunos/${student.id}`} className="block">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
              >
                {getInitials(student.full_name)}
              </div>
              {student.status === 'active' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-50" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{student.full_name ?? 'Aluno'}</p>
                {student.streak >= 7 && (
                  <span className="flex items-center gap-0.5 text-amber-400 text-[10px] font-bold">
                    <Flame className="w-3 h-3" /> {student.streak}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{student.goal ?? 'Sem objetivo definido'}</p>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40">
            <div className="text-center">
              <p className="font-bold text-sm">{student.totalWorkouts}</p>
              <p className="text-[10px] text-muted-foreground">Treinos</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-sm">{student.activeSheets}</p>
              <p className="text-[10px] text-muted-foreground">Fichas</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-sm text-amber-400 flex items-center justify-center gap-0.5">
                <Flame className="w-3 h-3" />{student.streak}
              </p>
              <p className="text-[10px] text-muted-foreground">Streak</p>
            </div>
          </div>

          {student.lastWorkout && (
            <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Último treino: {formatRelativeDate(student.lastWorkout)}</span>
            </div>
          )}
        </Link>
        </div>

        {isPersonal && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <Link
              href={`/treinos/novo?studentId=${student.id}`}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold transition-all bg-brand-500/10 text-brand-300 hover:bg-brand-500/20 border border-brand-500/20"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {student.activeSheets > 0 ? 'Nova ficha' : 'Atribuir ficha'}
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── InvitePanel ──────────────────────────────────────────────
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

  const link = invite ? `${window.location.origin}/convite/${invite.token}` : ''

  async function generate() {
    setStatus('generating')
    try {
      let expiresAt: string | null = null
      if (expiry === '7d') expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString()
      if (expiry === '30d') expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString()

      const res = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId, role: 'student', expiresAt, usesLimit: multiUse ? null : 1 }),
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
            <p className="text-sm font-semibold">Convite de aluno gerado!</p>
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
          <p className="text-xs text-muted-foreground">Compartilhe com o aluno</p>
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
          <p className="text-xs text-muted-foreground">Padrão: uso único por aluno</p>
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

// ── InviteCard ───────────────────────────────────────────────
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
export default function AlunosPage() {
  const { currentAcademy, currentRole } = useAuthStore()
  const supabase = createClient()

  const [students, setStudents] = useState<Student[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [showRevoked, setShowRevoked] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(0)
  const [totalStudents, setTotalStudents] = useState(0)

  // Expulsion flow
  const [expulsionTarget, setExpulsionTarget] = useState<Student | null>(null)
  const [expulsionReason, setExpulsionReason] = useState('')
  const [expulsionLoading, setExpulsionLoading] = useState(false)
  const [expulsionRequests, setExpulsionRequests] = useState<ExpulsionRequest[]>([])

  const debouncedSearch = useDebounce(search, 300)

  // Reseta paginação quando search ou filter mudam.
  useEffect(() => { setPage(0) }, [debouncedSearch, filter])

  const load = useCallback(async () => {
    if (!currentAcademy) { setLoading(false); return }
    setLoading(true)

    // RPC consolidada: members + profiles + metrics + filtro + paginação numa query.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: studentRows, error: rpcError } = await (supabase as any).rpc('list_academy_students', {
      p_academy_id: currentAcademy.id,
      p_search: debouncedSearch,
      p_status: filter,
      p_limit: PAGE_SIZE,
      p_offset: page * PAGE_SIZE,
    })

    if (rpcError) {
      console.warn('[alunos] list_academy_students indisponível — usando fallback. Aplique a migration 029 no Supabase.', rpcError?.message ?? rpcError)
      // Fallback: queries diretas quando o RPC falha (ex: função ainda não aplicada no banco).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let memberQuery = (supabase as any)
        .from('academy_members')
        .select('user_id, is_active', { count: 'exact' })
        .eq('academy_id', currentAcademy.id)
        .eq('role', 'student')
      if (filter === 'active')   memberQuery = memberQuery.eq('is_active', true)
      if (filter === 'inactive') memberQuery = memberQuery.eq('is_active', false)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberData, count: totalCount, error: memberError } = await memberQuery
        .order('is_active', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (memberError) {
        console.warn('[alunos] fallback error:', memberError?.message ?? memberError)
        toast.error('Erro ao carregar alunos.')
        setStudents([])
        setTotalStudents(0)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userIds = (memberData ?? []).map((m: any) => m.user_id) as string[]
        setTotalStudents(totalCount ?? 0)

        if (userIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profileData } = await (supabase as any)
            .from('profiles')
            .select('id, full_name, goal')
            .in('id', userIds)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profileMap = new Map<string, any>((profileData ?? []).map((p: any) => [p.id, p]))

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: sheetData } = await (supabase as any)
            .from('workout_sheets')
            .select('student_id')
            .eq('academy_id', currentAcademy.id)
            .in('student_id', userIds)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sheetCountMap = new Map<string, number>()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(sheetData ?? []).forEach((s: any) => {
            sheetCountMap.set(s.student_id, (sheetCountMap.get(s.student_id) ?? 0) + 1)
          })

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let mapped: Student[] = (memberData ?? []).map((m: any) => {
            const p = profileMap.get(m.user_id)
            return {
              id: m.user_id,
              full_name: p?.full_name ?? null,
              goal: p?.goal ?? null,
              lastWorkout: null,
              totalWorkouts: 0,
              activeSheets: sheetCountMap.get(m.user_id) ?? 0,
              streak: 0,
              status: (m.is_active ? 'active' : 'inactive') as 'active' | 'inactive',
            }
          })

          if (debouncedSearch) {
            const s = debouncedSearch.toLowerCase()
            mapped = mapped.filter(st => st.full_name?.toLowerCase().includes(s))
          }

          setStudents(mapped)
        } else {
          setStudents([])
        }
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (studentRows ?? []) as any[]
      setStudents(rows.map((r) => ({
        id: r.user_id,
        full_name: r.full_name,
        goal: r.goal,
        lastWorkout: r.last_workout,
        totalWorkouts: Number(r.total_workouts) || 0,
        activeSheets: Number(r.active_sheets) || 0,
        streak: 0,
        status: r.is_active ? 'active' : 'inactive',
      })))
      setTotalStudents(Number(rows[0]?.total_count ?? 0))
    }

    // Invites: query separada com limit defensivo.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inviteData } = await (supabase as any)
      .from('invites')
      .select('id, code, token, created_at, expires_at, uses_count, uses_limit, is_active')
      .eq('academy_id', currentAcademy.id)
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(100)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setInvites((inviteData ?? []).map((i: any) => ({
      id: i.id,
      code: i.code,
      token: i.token,
      createdAt: i.created_at,
      expiresAt: i.expires_at,
      usesCount: i.uses_count,
      usesLimit: i.uses_limit,
      isActive: i.is_active,
    })))

    setLoading(false)
  }, [currentAcademy, debouncedSearch, filter, page])

  useEffect(() => { load() }, [load])

  function handleRevoke(id: string) {
    setInvites((prev) => prev.map((i) => i.id === id ? { ...i, isActive: false } : i))
  }

  function handleInviteCreated(invite: PendingInvite) {
    setInvites((prev) => [invite, ...prev])
  }

  // ── Expulsion requests (owner only) ─────────────────────────
  const loadExpulsionRequests = useCallback(async () => {
    if (!currentAcademy || currentRole !== 'owner') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('expulsion_requests')
      .select('id, student_id, student_member_id, reason, created_at, requested_by')
      .eq('academy_id', currentAcademy.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (!data?.length) { setExpulsionRequests([]); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ids = data.map((r: any) => r.student_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reqByIds = data.map((r: any) => r.requested_by)
    const allIds = [...new Set([...ids, ...reqByIds])]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (supabase as any)
      .from('profiles').select('id, full_name').in('id', allIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nameMap: Record<string, string | null> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setExpulsionRequests(data.map((r: any) => ({
      id: r.id,
      studentId: r.student_id,
      studentMemberId: r.student_member_id,
      studentName: nameMap[r.student_id] ?? null,
      requestedByName: nameMap[r.requested_by] ?? null,
      reason: r.reason,
      createdAt: r.created_at,
    })))
  }, [currentAcademy, currentRole, supabase])

  useEffect(() => { loadExpulsionRequests() }, [loadExpulsionRequests])

  // Owner: aprova a expulsão → inativa o aluno
  async function handleApproveExpulsion(req: ExpulsionRequest) {
    if (!currentAcademy) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      // Apaga o vínculo; expulsion_requests.student_member_id é ON DELETE CASCADE,
      // então o próprio pedido some junto (o update abaixo vira no-op inofensivo).
      const { data: deleted, error } = await sb.from('academy_members')
        .delete()
        .eq('id', req.studentMemberId)
        .select('id')
      if (error) throw error
      if (!deleted || deleted.length === 0) throw new Error('Sem permissão para remover este aluno.')
      await sb.from('expulsion_requests')
        .update({ status: 'approved', resolved_at: new Date().toISOString(), resolved_by: user?.id })
        .eq('id', req.id)
      toast.success(`${req.studentName ?? 'Aluno'} foi removido da academia.`)
      setExpulsionRequests((prev) => prev.filter((r) => r.id !== req.id))
      load()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao remover aluno.')
    }
  }

  // Owner: rejeita o pedido
  async function handleRejectExpulsion(req: ExpulsionRequest) {
    if (!currentAcademy) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('expulsion_requests')
        .update({ status: 'rejected', resolved_at: new Date().toISOString(), resolved_by: user?.id })
        .eq('id', req.id)
      toast.success('Pedido de remoção rejeitado.')
      setExpulsionRequests((prev) => prev.filter((r) => r.id !== req.id))
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao rejeitar pedido.')
    }
  }

  // Owner: remove diretamente (sem pedido)
  async function handleDirectExpel(student: Student) {
    if (!currentAcademy) return
    setExpulsionLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberList } = await (supabase as any)
        .from('academy_members')
        .select('id')
        .eq('academy_id', currentAcademy.id)
        .eq('user_id', student.id)
        .eq('role', 'student')
        .limit(1)
      const memberData = memberList?.[0]
      if (!memberData) throw new Error('Membro não encontrado.')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deleted, error } = await (supabase as any)
        .from('academy_members')
        .delete()
        .eq('id', memberData.id)
        .select('id')
      if (error) throw error
      if (!deleted || deleted.length === 0) throw new Error('Sem permissão para remover este aluno.')
      toast.success(`${student.full_name ?? 'Aluno'} foi removido da academia.`)
      setExpulsionTarget(null)
      setExpulsionReason('')
      load()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao remover aluno.')
    } finally {
      setExpulsionLoading(false)
    }
  }

  // Personal: submete pedido ao owner
  async function handleRequestExpulsion(student: Student) {
    if (!currentAcademy || !expulsionReason.trim()) return
    setExpulsionLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberList2 } = await (supabase as any)
        .from('academy_members')
        .select('id, role')
        .eq('academy_id', currentAcademy.id)
        .eq('user_id', student.id)
        .limit(1)
      const memberData = memberList2?.[0]
      if (!memberData) throw new Error('Membro não encontrado.')
      if (memberData.role === 'owner') {
        toast.error('Não é possível solicitar a remoção do dono da academia.')
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('expulsion_requests').insert({
        academy_id: currentAcademy.id,
        student_id: student.id,
        student_member_id: memberData.id,
        requested_by: user?.id,
        reason: expulsionReason.trim(),
      })
      if (error) throw error
      toast.success('Pedido de remoção enviado ao dono da academia.')
      setExpulsionTarget(null)
      setExpulsionReason('')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao enviar pedido.')
    } finally {
      setExpulsionLoading(false)
    }
  }

  // students já vem filtrado/paginado do server (search + status server-side via RPC).
  const filtered = students

  const activeInvites = invites.filter(
    (i) => i.isActive && !isExpired(i.expiresAt) && !isExhausted(i.usesCount, i.usesLimit)
  )
  const revokedInvites = invites.filter(
    (i) => !i.isActive || isExpired(i.expiresAt) || isExhausted(i.usesCount, i.usesLimit)
  )

  const totalPages = Math.max(1, Math.ceil(totalStudents / PAGE_SIZE))
  const showingFrom = totalStudents === 0 ? 0 : page * PAGE_SIZE + 1
  const showingTo   = Math.min(totalStudents, (page + 1) * PAGE_SIZE)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">
            {currentRole === 'personal' ? 'Meus alunos' : 'Alunos'}
          </h2>
          <p className="section-subtitle mt-1">
            {loading
              ? 'Carregando...'
              : `${totalStudents} ${totalStudents === 1 ? 'aluno' : 'alunos'}${filter !== 'all' ? ` (${filter === 'active' ? 'ativos' : 'inativos'})` : ''}`}
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
            {currentRole === 'owner' && (
              <Link href="/personais" className="btn-secondary text-sm py-2.5 px-5 rounded-xl flex items-center gap-2">
                <ShieldOff className="w-4 h-4" />
                Gerenciar personais
              </Link>
            )}
            {(currentRole === 'owner' || currentRole === 'personal') && (
              <button
                onClick={() => setShowInvitePanel(!showInvitePanel)}
                className={cn('btn-primary text-sm py-2.5 px-5 rounded-xl', showInvitePanel && 'opacity-70')}
              >
                <UserPlus className="w-4 h-4" />
                Convidar aluno
              </button>
            )}
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

          {/* ── Coluna esquerda: alunos ── */}
          <div className="space-y-4">

            {/* Filtros */}
            {(students.length > 0 || filter !== 'all') && (
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar alunos..."
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

            {/* Lista de alunos */}
            <motion.div variants={fadeUp} className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Alunos
                  <span className="badge text-[10px] py-0.5 px-1.5 bg-surface-200 border-0 font-bold">{totalStudents}</span>
                </p>
              </div>

              {students.length === 0 && filter === 'all' ? (
                <div className="glass rounded-2xl p-8 text-center border border-dashed border-border/40">
                  <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Nenhum aluno ainda</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Convide seus primeiros alunos usando um link ou código de convite.
                  </p>
                  {currentAcademy && (
                    <button
                      onClick={() => setShowInvitePanel(true)}
                      className="btn-primary text-xs py-2 px-4 rounded-xl mt-4 inline-flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Convidar primeiro aluno
                    </button>
                  )}
                </div>
              ) : students.length === 0 || filtered.length === 0 ? (
                <div className="text-center py-10">
                  <p className="font-semibold text-muted-foreground">
                    {students.length === 0
                      ? `Nenhum aluno ${filter === 'active' ? 'ativo' : 'inativo'}`
                      : 'Nenhum aluno encontrado'}
                  </p>
                  <button onClick={() => { setSearch(''); setFilter('all') }} className="text-sm text-brand-400 mt-2 hover:underline">
                    Ver todos os alunos
                  </button>
                </div>
              ) : (
                <>
                  <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filtered.map((student) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        isPersonal={currentRole === 'personal'}
                        onExpel={(s) => { setExpulsionTarget(s); setExpulsionReason('') }}
                      />
                    ))}
                  </motion.div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <p className="text-xs text-muted-foreground">
                        Mostrando {showingFrom}–{showingTo} de {totalStudents}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                          disabled={page === 0 || loading}
                          className="px-3 py-1.5 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          Anterior
                        </button>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {page + 1} / {totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={page >= totalPages - 1 || loading}
                          className="px-3 py-1.5 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>
                  )}
                </>
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

            {/* Histórico */}
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

            {/* Info de roles */}
            <div className="glass rounded-xl p-4 border border-border/30 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sobre convites</p>
              {[
                { label: 'Uso único', desc: 'Pode ser usado por apenas um aluno', color: '#10B981' },
                { label: 'Ilimitado', desc: 'Qualquer aluno pode usar o mesmo link', color: '#06B6D4' },
                { label: 'Validade', desc: 'Expira automaticamente após o prazo', color: '#6366F1' },
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

      {/* ── Pedidos de expulsão pendentes (owner) ── */}
      {currentRole === 'owner' && expulsionRequests.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass rounded-2xl p-5 border border-red-500/20">
          <div className="flex items-center gap-2 mb-4">
            <UserX className="w-4 h-4 text-red-400" />
            <h3 className="font-display font-bold text-sm text-red-300">
              Pedidos de remoção pendentes
              <span className="ml-2 badge text-[10px] py-0.5 px-1.5 bg-red-500/15 text-red-300 border-red-500/20">{expulsionRequests.length}</span>
            </h3>
          </div>
          <div className="space-y-3">
            {expulsionRequests.map((req) => (
              <div key={req.id} className="bg-surface-100 rounded-xl p-4 border border-border/40 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{req.studentName ?? 'Aluno'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Solicitado por <span className="font-medium text-foreground/70">{req.requestedByName ?? 'Personal'}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground bg-surface-200 rounded-lg px-3 py-2">
                  <span className="font-semibold text-foreground/60">Motivo: </span>{req.reason}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleApproveExpulsion(req)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/20 transition-all"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Aprovar remoção
                  </button>
                  <button
                    onClick={() => handleRejectExpulsion(req)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-200 border border-border/40 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Modal de expulsão ── */}
      <AnimatePresence>
        {expulsionTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!expulsionLoading) { setExpulsionTarget(null); setExpulsionReason('') } }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-md glass rounded-2xl p-6 border border-border/60 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                  <UserX className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm">
                    {currentRole === 'personal' ? 'Solicitar remoção' : 'Remover aluno'}
                  </p>
                  <p className="text-xs text-muted-foreground">{expulsionTarget.full_name ?? 'Aluno'}</p>
                </div>
              </div>

              {currentRole === 'personal' ? (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    Informe o motivo. O dono da academia precisará aprovar antes da remoção ser efetivada.
                  </p>
                  <textarea
                    value={expulsionReason}
                    onChange={(e) => setExpulsionReason(e.target.value)}
                    placeholder="Ex: Comportamento inadequado, inadimplência..."
                    rows={3}
                    className="field w-full resize-none text-sm mb-4"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestExpulsion(expulsionTarget)}
                      disabled={!expulsionReason.trim() || expulsionLoading}
                      className="flex-1 btn-primary py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {expulsionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserX className="w-4 h-4" /> Enviar pedido</>}
                    </button>
                    <button
                      onClick={() => { setExpulsionTarget(null); setExpulsionReason('') }}
                      disabled={expulsionLoading}
                      className="px-4 py-2.5 rounded-xl text-sm border border-border/60 text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-4">
                    O aluno perderá o acesso à academia. Esta ação pode ser revertida reativando o aluno.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDirectExpel(expulsionTarget)}
                      disabled={expulsionLoading}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {expulsionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserX className="w-4 h-4" /> Confirmar remoção</>}
                    </button>
                    <button
                      onClick={() => { setExpulsionTarget(null); setExpulsionReason('') }}
                      disabled={expulsionLoading}
                      className="px-4 py-2.5 rounded-xl text-sm border border-border/60 text-muted-foreground hover:text-foreground hover:bg-surface-100 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, UserPlus, Filter, Dumbbell, Flame,
  Clock, ChevronRight, Copy, Loader2, Users,
  Link2, CheckCircle2, ClipboardList,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { cn, formatRelativeDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

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

function computeStreak(timestamps: string[]): number {
  if (timestamps.length === 0) return 0
  const daySet = new Set(timestamps.map((t) => t.slice(0, 10)))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!daySet.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function getInitials(name: string | null) {
  if (!name) return 'A'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function StudentCard({ student, isPersonal }: { student: Student; isPersonal?: boolean }) {
  const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#EC4899']
  const color = colors[(student.full_name?.charCodeAt(0) ?? 0) % colors.length]!

  return (
    <motion.div variants={fadeUp}>
      <div className="glass rounded-2xl p-4 hover:border-brand-500/20 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-card-hover">
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
                {student.streak > 0 && (
                  <span className={cn(
                    'flex items-center gap-0.5 text-[10px] font-bold',
                    student.streak >= 7 ? 'text-amber-400' :
                    student.streak >= 3 ? 'text-amber-400/60' :
                    'text-amber-400/35',
                  )}>
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
              <p className={cn(
                'font-bold text-sm flex items-center justify-center gap-0.5',
                student.streak >= 7 ? 'text-amber-400' :
                student.streak >= 3 ? 'text-amber-400/60' :
                student.streak > 0 ? 'text-amber-400/35' :
                'text-muted-foreground/40',
              )}>
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

        {/* Ação rápida exclusiva para personal */}
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

function InvitePanel({ onClose, academyId, role }: { onClose: () => void; academyId: string; role: 'student' | 'personal' }) {
  const supabase = createClient()
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle')
  const [invite, setInvite] = useState<{ code: string; token: string; expiresAt: string | null; usesLimit: number | null } | null>(null)
  const [expiry, setExpiry] = useState<'7d' | '30d' | 'never'>('7d')
  const [multiUse, setMultiUse] = useState(false)

  const label = role === 'personal' ? 'personal' : 'aluno'
  const link = invite ? `${window.location.origin}/convite/${invite.token}` : ''

  async function generate() {
    setStatus('generating')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem 0,1,I,O
      const code = Array.from({ length: 6 }, () => SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]).join('')
      const token = crypto.randomUUID()

      let expiresAt: string | null = null
      if (expiry === '7d') expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString()
      if (expiry === '30d') expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('invites').insert({
        academy_id: academyId,
        created_by: user.id,
        code,
        token,
        role,
        expires_at: expiresAt,
        uses_limit: multiUse ? null : 1,
      })

      if (error) throw error
      setInvite({ code, token, expiresAt, usesLimit: multiUse ? null : 1 })
      setStatus('done')
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
        exit={{ opacity: 0, y: 8 }}
        className="glass rounded-2xl p-5 border border-brand-500/20 shadow-glow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <p className="text-sm font-semibold">Convite de {label} gerado!</p>
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
                catch { toast.error('Não foi possível copiar — copie o código manualmente.') }
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
                catch { toast.error('Não foi possível copiar — copie o link manualmente.') }
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

        <button onClick={() => { setStatus('idle'); setInvite(null) }} className="text-xs text-brand-400 hover:underline">
          Gerar outro convite
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="glass rounded-2xl p-5 border border-brand-500/20 shadow-glow-sm space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <p className="font-display font-bold text-sm">Convidar {label}</p>
            <p className="text-xs text-muted-foreground">Compartilhe o link ou código</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">Fechar</button>
      </div>

      {/* Validade */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Validade do convite</p>
        <div className="flex gap-2">
          {([
            { value: '7d', label: '7 dias' },
            { value: '30d', label: '30 dias' },
            { value: 'never', label: 'Sem validade' },
          ] as const).map(({ value, label: l }) => (
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
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de uso */}
      <div className="flex items-center justify-between glass rounded-xl p-3">
        <div>
          <p className="text-sm font-medium">Usos ilimitados</p>
          <p className="text-xs text-muted-foreground">Padrão: uso único por {label}</p>
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
            Gerar convite de {label}
          </>
        )}
      </button>
    </motion.div>
  )
}

export default function AlunosPage() {
  const [search, setSearch] = useState('')
  const [inviteRole, setInviteRole] = useState<'student' | 'personal' | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const { currentAcademy, currentRole } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      if (!currentAcademy) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data: members, error } = await sb
        .from('academy_members')
        .select('user_id, is_active, profile:profiles ( full_name, goal )')
        .eq('academy_id', currentAcademy.id)
        .eq('role', 'student')

      if (error || !members) { setLoading(false); return }

      const studentIds: string[] = (members as { user_id: string }[]).map((m) => m.user_id)
      const ids = studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000']

      const [{ data: sheetsData }, { data: logsData }] = await Promise.all([
        sb.from('workout_sheets')
          .select('student_id')
          .eq('academy_id', currentAcademy.id)
          .eq('is_active', true)
          .in('student_id', ids),
        sb.from('workout_logs')
          .select('student_id, created_at')
          .eq('academy_id', currentAcademy.id)
          .in('student_id', ids)
          .order('created_at', { ascending: false }),
      ])

      const sheetCounts: Record<string, number> = {}
      for (const s of (sheetsData ?? [])) {
        sheetCounts[s.student_id] = (sheetCounts[s.student_id] ?? 0) + 1
      }

      const workoutAgg: Record<string, { total: number; last: string | null; dates: string[] }> = {}
      for (const log of (logsData ?? [])) {
        if (!workoutAgg[log.student_id]) workoutAgg[log.student_id] = { total: 0, last: null, dates: [] }
        workoutAgg[log.student_id].total++
        if (!workoutAgg[log.student_id].last) workoutAgg[log.student_id].last = log.created_at
        workoutAgg[log.student_id].dates.push(log.created_at)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setStudents((members as any[]).map((m) => ({
        id: m.user_id,
        full_name: m.profile?.full_name ?? null,
        goal: m.profile?.goal ?? null,
        lastWorkout: workoutAgg[m.user_id]?.last ?? null,
        totalWorkouts: workoutAgg[m.user_id]?.total ?? 0,
        activeSheets: sheetCounts[m.user_id] ?? 0,
        streak: computeStreak(workoutAgg[m.user_id]?.dates ?? []),
        status: m.is_active ? 'active' : 'inactive',
      })))
      setLoading(false)
    }
    load()
  }, [currentAcademy])

  const filtered = students.filter((s) => {
    const matchesSearch = (s.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || s.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">
            {currentRole === 'personal' ? 'Meus alunos' : 'Alunos'}
          </h2>
          <p className="section-subtitle mt-1">
            {loading ? 'Carregando...' : `${students.length} ${students.length === 1 ? 'aluno' : 'alunos'} · ${students.filter((s) => s.status === 'active').length} ativos`}
          </p>
        </div>
        {currentAcademy && (
          <div className="flex items-center gap-2">
            {currentRole === 'owner' && (
              <button
                onClick={() => setInviteRole(inviteRole === 'personal' ? null : 'personal')}
                className="btn-secondary text-sm py-2.5 px-5 rounded-xl"
              >
                <Dumbbell className="w-4 h-4" />
                Convidar personal
              </button>
            )}
            {currentRole === 'personal' && (
              <Link href="/treinos/novo" className="btn-secondary text-sm py-2.5 px-5 rounded-xl flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Nova ficha
              </Link>
            )}
            {(currentRole === 'owner' || currentRole === 'personal') && (
              <button
                onClick={() => setInviteRole(inviteRole === 'student' ? null : 'student')}
                className="btn-primary text-sm py-2.5 px-5 rounded-xl"
              >
                <UserPlus className="w-4 h-4" />
                Convidar aluno
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Invite panel */}
      {inviteRole && currentAcademy && (
        <InvitePanel onClose={() => setInviteRole(null)} academyId={currentAcademy.id} role={inviteRole} />
      )}

      {/* Filters */}
      {students.length > 0 && (
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

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((student) => (
            <StudentCard key={student.id} student={student} isPersonal={currentRole === 'personal'} />
          ))}
        </motion.div>
      )}

      {/* Empty state — no students yet */}
      {!loading && students.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-muted-foreground">Nenhum aluno ainda</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Convide seus primeiros alunos usando um link ou código de convite.
          </p>
          {currentAcademy && (
            <button
              onClick={() => setInviteRole('student')}
              className="btn-primary text-sm py-2.5 px-5 rounded-xl mt-4 inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Convidar primeiro aluno
            </button>
          )}
        </motion.div>
      )}

      {/* Search no result */}
      {!loading && students.length > 0 && filtered.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <p className="font-semibold text-muted-foreground">Nenhum aluno encontrado</p>
          <button onClick={() => { setSearch(''); setFilter('all') }} className="text-sm text-brand-400 mt-2 hover:underline">
            Limpar filtros
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

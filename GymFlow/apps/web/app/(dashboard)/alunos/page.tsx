'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, UserPlus, Filter, Dumbbell, Flame,
  Clock, ChevronRight, Copy, Send, Loader2, Users,
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

function getInitials(name: string | null) {
  if (!name) return 'A'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function StudentCard({ student }: { student: Student }) {
  const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#EC4899']
  const color = colors[(student.full_name?.charCodeAt(0) ?? 0) % colors.length]!

  return (
    <motion.div variants={fadeUp}>
      <Link href={`/alunos/${student.id}`}>
        <div className="glass rounded-2xl p-4 hover:border-brand-500/20 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-card-hover cursor-pointer group">
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

            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0 mt-0.5" />
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
        </div>
      </Link>
    </motion.div>
  )
}

function InvitePanel({ onClose, academyId, role }: { onClose: () => void; academyId: string; role: 'student' | 'personal' }) {
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const supabase = createClient()

  async function generateInvite() {
    setGenerating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('invites').insert({
        academy_id: academyId,
        created_by: user.id,
        code,
        token,
        role,
        expires_at: expiresAt,
        uses_limit: 1,
      })

      setInviteCode(code)
      setInviteLink(`${window.location.origin}/convite/${token}`)
    } catch {
      toast.error('Erro ao gerar convite.')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => { generateInvite() }, [])

  const label = role === 'personal' ? 'personal' : 'aluno'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="glass rounded-2xl p-5 border border-brand-500/20 shadow-glow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold">Convidar {label}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
          Fechar
        </button>
      </div>

      {generating || !inviteCode ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Código de convite de {label} (válido por 7 dias)</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono font-black text-2xl text-center tracking-[0.3em] py-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300">
                {inviteCode}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(inviteCode); toast.success('Código copiado!') }}
                className="p-3 rounded-xl border border-border/60 hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="divider" />

          {inviteLink && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Link de convite</p>
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink} className="field text-xs flex-1" />
                <button
                  onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('Link copiado!') }}
                  className="p-3 rounded-xl border border-border/60 hover:bg-surface-200 transition-all text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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

      // Load academy members with role=student
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: members, error } = await (supabase as any)
        .from('academy_members')
        .select(`
          user_id, is_active,
          profile:profiles ( full_name, goal )
        `)
        .eq('academy_id', currentAcademy.id)
        .eq('role', 'student')

      if (error || !members) { setLoading(false); return }

      const studentIds: string[] = (members as { user_id: string }[]).map((m) => m.user_id)

      // Fetch active sheet counts per student
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sheetsData } = await (supabase as any)
        .from('workout_sheets')
        .select('student_id')
        .eq('academy_id', currentAcademy!.id)
        .eq('is_active', true)
        .in('student_id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000'])

      const sheetCounts: Record<string, number> = {}
      ;(sheetsData ?? []).forEach((s: { student_id: string }) => {
        sheetCounts[s.student_id] = (sheetCounts[s.student_id] ?? 0) + 1
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enriched: Student[] = (members as any[]).map((m) => ({
        id: m.user_id,
        full_name: m.profile?.full_name ?? null,
        goal: m.profile?.goal ?? null,
        lastWorkout: null,
        totalWorkouts: 0,
        activeSheets: sheetCounts[m.user_id] ?? 0,
        streak: 0,
        status: m.is_active ? 'active' : 'inactive',
      }))

      setStudents(enriched)
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
          <h2 className="section-title">Alunos</h2>
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
            <button
              onClick={() => setInviteRole(inviteRole === 'student' ? null : 'student')}
              className="btn-primary text-sm py-2.5 px-5 rounded-xl"
            >
              <UserPlus className="w-4 h-4" />
              Convidar aluno
            </button>
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
            <StudentCard key={student.id} student={student} />
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

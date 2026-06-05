'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, ClipboardList, Dumbbell, Clock, Target,
  ChevronRight, Edit2, Trash2, Play, Users, Eye, UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Skeleton } from '@/components/ui/skeleton'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

interface Sheet {
  id: string
  name: string
  goal: string | null
  is_active: boolean
  created_at: string
  schedule_type?: string | null
  student_name?: string | null
  exercise_count?: number
}

const SCHEDULE_BADGE: Record<string, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
}

function MoreVertical({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  )
}

const GOAL_COLORS: Record<string, string> = {
  'Hipertrofia': '#6366F1',
  'Força': '#10B981',
  'Condicionamento': '#06B6D4',
  'Perda de peso': '#F97316',
  'Reabilitação': '#F59E0B',
  'Flexibilidade': '#EC4899',
}

function SheetCard({ sheet, isPersonal, isStudent, readOnly, onDelete }: {
  sheet: Sheet
  isPersonal: boolean
  isStudent?: boolean
  readOnly?: boolean
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const color = GOAL_COLORS[sheet.goal ?? ''] ?? '#6366F1'

  return (
    <motion.div variants={fadeUp} className="glass rounded-2xl overflow-hidden group hover:border-brand-500/20 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-card-hover">
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {sheet.goal && (
                <span className="badge text-[10px]" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>
                  {sheet.goal}
                </span>
              )}
              {sheet.is_active && <span className="badge-success text-[10px]">Ativa</span>}
              {sheet.schedule_type && SCHEDULE_BADGE[sheet.schedule_type] && (
                <span className="badge text-[10px]">{SCHEDULE_BADGE[sheet.schedule_type]}</span>
              )}
            </div>
            <h3 className="font-display font-bold text-sm leading-snug">{sheet.name}</h3>
            {isPersonal && sheet.student_name && (
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Users className="w-2.5 h-2.5" />
                {sheet.student_name}
              </p>
            )}
          </div>

          {isPersonal && !readOnly && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-8 w-40 glass rounded-xl border border-border/60 shadow-xl z-10 overflow-hidden"
                  >
                    {[
                      { icon: Eye, label: 'Ver detalhes', href: `/treinos/${sheet.id}` },
                      {
                        icon: Trash2,
                        label: confirmDelete ? 'Confirmar exclusão?' : 'Excluir',
                        href: '#',
                        danger: true,
                        onClick: () => {
                          if (!confirmDelete) {
                            setConfirmDelete(true)
                            setTimeout(() => setConfirmDelete(false), 3000)
                          } else {
                            setMenuOpen(false)
                            setConfirmDelete(false)
                            onDelete(sheet.id)
                          }
                        },
                      },
                    ].map(({ icon: Icon, label, href, danger, onClick }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={(e) => { if (onClick) { e.preventDefault(); onClick() } else setMenuOpen(false) }}
                        className={cn(
                          'flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all',
                          danger
                            ? 'text-red-400 hover:bg-red-500/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-surface-200'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-100">
            <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="font-bold text-xs">{sheet.exercise_count ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">exercícios</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-100">
            <Target className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="font-bold text-xs truncate">{sheet.goal ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground">objetivo</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/treinos/${sheet.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver ficha
          </Link>
          {isStudent && !readOnly && (
            <Link
              href={`/treinos/executar/${sheet.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
            >
              <Play className="w-3 h-3" />
              Executar
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function TreinosPage() {
  const [search, setSearch] = useState('')
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [hasStudents, setHasStudents] = useState(false)
  const [loading, setLoading] = useState(true)
  const { currentRole, currentAcademy } = useAuthStore()
  const supabase = createClient()
  const isOwner    = currentRole === 'owner'
  const isPersonal = currentRole === 'personal'
  const isStudent  = currentRole === 'student'

  useEffect(() => {
    async function load() {
      if (!currentAcademy) { setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()

      // Para personal: precisa saber se tem aluno antes de oferecer "Nova ficha".
      // Personal sem aluno cai num form que nunca pode ser submetido (precisa selectionar
      // aluno mas não tem opção). Pré-detectar evita esse beco sem saída.
      if (isPersonal) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count, error: countError } = await (supabase as any)
          .from('academy_members')
          .select('id', { count: 'exact', head: true })
          .eq('academy_id', currentAcademy.id)
          .eq('role', 'student')
          .eq('is_active', true)
        if (countError) console.warn('[treinos] count alunos falhou:', countError?.message ?? countError)
        setHasStudents((count ?? 0) > 0)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('workout_sheets')
        .select(`
          id, name, goal, is_active, created_at, student_id, schedule_type,
          sheet_exercises ( id )
        `)
        .eq('academy_id', currentAcademy.id)
        .order('created_at', { ascending: false })

      // Student sees only their own sheets
      if (isStudent && user) {
        query = query.eq('student_id', user.id)
      }

      const { data, error } = await query
      if (error) { toast.error('Erro ao carregar fichas.'); setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (data ?? []).map((s: any) => ({
        ...s,
        exercise_count: s.sheet_exercises?.length ?? 0,
      }))

      // For personal: resolve student names
      if (isPersonal && mapped.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const studentIds = [...new Set<string>(mapped.map((s: any) => s.student_id).filter(Boolean))]
        if (studentIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profilesData } = await (supabase as any)
            .from('profiles')
            .select('id, full_name')
            .in('id', studentIds)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profileMap: Record<string, string | null> = {}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(profilesData ?? []).forEach((p: any) => { profileMap[p.id] = p.full_name ?? null })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSheets(mapped.map((s: any) => ({ ...s, student_name: profileMap[s.student_id] ?? null })))
        } else {
          setSheets(mapped)
        }
      } else {
        setSheets(mapped)
      }

      setLoading(false)
    }
    load()
  }, [currentAcademy, currentRole])

  async function handleDelete(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('workout_sheets').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir ficha.'); return }
    setSheets((prev) => prev.filter((s) => s.id !== id))
    toast.success('Ficha excluída.')
  }

  const filtered = sheets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.student_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Fichas de treino</h2>
          <p className="section-subtitle mt-1">
            {loading ? 'Carregando...' : `${sheets.length} ${sheets.length === 1 ? 'ficha' : 'fichas'} · ${sheets.filter((s) => s.is_active).length} ativas`}
          </p>
        </div>
        {isPersonal && hasStudents && (
          <Link href="/treinos/novo" className="btn-primary text-sm py-2.5 px-5 rounded-xl">
            <Plus className="w-4 h-4" />
            Nova ficha
          </Link>
        )}
        {isPersonal && !hasStudents && !loading && (
          <Link href="/alunos" className="btn-primary text-sm py-2.5 px-5 rounded-xl">
            <UserPlus className="w-4 h-4" />
            Convidar aluno
          </Link>
        )}
      </motion.div>

      {/* Search */}
      {sheets.length > 0 && (
        <motion.div variants={fadeUp} className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar fichas..."
            className="field pl-10"
          />
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden">
              <Skeleton className="h-1 rounded-none" />
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((sheet) => (
            <SheetCard key={sheet.id} sheet={sheet} isPersonal={isPersonal} isStudent={isStudent} readOnly={isOwner} onDelete={handleDelete} />
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && sheets.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            {isPersonal && !hasStudents
              ? <Users className="w-7 h-7 text-muted-foreground/40" />
              : <ClipboardList className="w-7 h-7 text-muted-foreground/40" />}
          </div>
          <p className="font-semibold text-muted-foreground">
            {isOwner
              ? 'Nenhuma ficha cadastrada'
              : isPersonal
              ? (hasStudents ? 'Nenhuma ficha criada ainda' : 'Convide alunos para começar')
              : 'Nenhuma ficha atribuída a você'}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {isOwner
              ? 'Os personais ainda não criaram fichas para os alunos.'
              : isPersonal
              ? (hasStudents
                  ? 'Crie fichas de treino e atribua aos seus alunos.'
                  : 'Você precisa ter pelo menos 1 aluno antes de criar fichas de treino.')
              : 'Aguarde seu personal trainer criar uma ficha para você.'}
          </p>
          {isPersonal && hasStudents && (
            <Link href="/treinos/novo" className="btn-primary text-sm py-2 px-4 rounded-xl mt-4 inline-flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Criar primeira ficha
            </Link>
          )}
          {isPersonal && !hasStudents && (
            <Link href="/alunos" className="btn-primary text-sm py-2 px-4 rounded-xl mt-4 inline-flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              Convidar primeiro aluno
            </Link>
          )}
        </motion.div>
      )}

      {/* Search no result */}
      {!loading && sheets.length > 0 && filtered.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <p className="font-semibold text-muted-foreground">Nenhuma ficha encontrada</p>
          <button onClick={() => setSearch('')} className="text-sm text-brand-400 mt-2 hover:underline">
            Limpar busca
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

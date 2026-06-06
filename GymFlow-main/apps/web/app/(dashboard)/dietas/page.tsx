'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Search, Salad, Target, Flame, Users, Trash2, ChevronRight, UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { cn, DIET_GOAL_COLORS } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Skeleton } from '@/components/ui/skeleton'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

interface Plan {
  id: string
  name: string
  goal: string | null
  daily_calories: number | null
  is_active: boolean
  created_at: string
  student_id: string
  student_name?: string | null
  item_count?: number
}

function PlanCard({ plan, isPersonal, readOnly, onDelete }: {
  plan: Plan
  isPersonal: boolean
  readOnly?: boolean
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const color = DIET_GOAL_COLORS[plan.goal ?? ''] ?? '#10B981'

  return (
    <motion.div variants={fadeUp} className="glass rounded-2xl overflow-hidden group hover:border-brand-500/20 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-card-hover">
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {plan.goal && (
                <span className="badge text-[10px]" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>{plan.goal}</span>
              )}
              {plan.is_active && <span className="badge-success text-[10px]">Ativo</span>}
            </div>
            <h3 className="font-display font-bold text-sm leading-snug">{plan.name}</h3>
            {isPersonal && plan.student_name && (
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Users className="w-2.5 h-2.5" /> {plan.student_name}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
            <Salad className="w-4.5 h-4.5" style={{ color }} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Salad className="w-3 h-3" /> {plan.item_count ?? 0} refeições</span>
          {plan.daily_calories ? <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {plan.daily_calories} kcal/dia</span> : null}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dietas/${plan.id}`} className="flex-1 btn-secondary text-xs py-2 rounded-xl text-center">Ver plano</Link>
          {isPersonal && !readOnly && (
            confirmDelete ? (
              <div className="flex gap-1.5">
                <button onClick={() => { onDelete(plan.id); setConfirmDelete(false) }} className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all">Excluir</button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 rounded-xl text-xs btn-secondary">Não</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} aria-label="Excluir plano" className="p-2 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function DietasPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hasStudents, setHasStudents] = useState(true)
  const { currentRole, currentAcademy } = useAuthStore()
  const supabase = createClient()
  const isOwner = currentRole === 'owner'
  const isPersonal = currentRole === 'personal'
  const isStudent = currentRole === 'student'

  useEffect(() => {
    async function load() {
      if (!currentAcademy) { setLoading(false); return }
      const { data: { user } } = await supabase.auth.getUser()

      if (isPersonal) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase as any)
          .from('academy_members')
          .select('id', { count: 'exact', head: true })
          .eq('academy_id', currentAcademy.id)
          .eq('role', 'student')
          .eq('is_active', true)
        setHasStudents((count ?? 0) > 0)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('meal_plans')
        .select('id, name, goal, daily_calories, is_active, created_at, student_id, meal_plan_items ( id )')
        .eq('academy_id', currentAcademy.id)
        .order('created_at', { ascending: false })

      if (isStudent && user) query = query.eq('student_id', user.id)

      const { data, error } = await query
      if (error) { toast.error('Erro ao carregar planos.'); setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (data ?? []).map((p: any) => ({ ...p, item_count: p.meal_plan_items?.length ?? 0 }))

      if (isPersonal && mapped.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const studentIds = [...new Set<string>(mapped.map((p: any) => p.student_id).filter(Boolean))]
        if (studentIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profilesData } = await (supabase as any).from('profiles').select('id, full_name').in('id', studentIds)
          const profileMap: Record<string, string | null> = {}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(profilesData ?? []).forEach((p: any) => { profileMap[p.id] = p.full_name ?? null })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPlans(mapped.map((p: any) => ({ ...p, student_name: profileMap[p.student_id] ?? null })))
        } else setPlans(mapped)
      } else setPlans(mapped)

      setLoading(false)
    }
    load()
  }, [currentAcademy, currentRole])

  async function handleDelete(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('meal_plans').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir plano.'); return }
    setPlans((prev) => prev.filter((p) => p.id !== id))
    toast.success('Plano excluído.')
  }

  const filtered = plans.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || (p.student_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">{isStudent ? 'Meus planos alimentares' : 'Planos alimentares'}</h2>
          <p className="section-subtitle mt-1">
            {loading ? 'Carregando...' : `${plans.length} ${plans.length === 1 ? 'plano' : 'planos'} · ${plans.filter((p) => p.is_active).length} ativos`}
          </p>
        </div>
        {isPersonal && hasStudents && (
          <Link href="/dietas/novo" className="btn-primary text-sm py-2.5 px-5 rounded-xl inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo plano
          </Link>
        )}
      </motion.div>

      {/* Owner aviso: só visualização */}
      {isOwner && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300/90">
          Como proprietário, você acompanha os planos alimentares da academia. A atribuição a alunos é feita pelos personais.
        </motion.div>
      )}

      {/* Personal sem alunos */}
      {isPersonal && !hasStudents && !loading && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-6 border border-border/60 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-5 h-5 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-sm">Você ainda não tem alunos</p>
          <p className="text-xs text-muted-foreground mt-1">Convide um aluno para poder atribuir planos alimentares.</p>
          <Link href="/alunos" className="btn-primary text-xs py-2 px-4 rounded-xl mt-4 inline-flex">Ir para alunos</Link>
        </motion.div>
      )}

      {/* Busca */}
      {!loading && plans.length > 0 && (
        <motion.div variants={fadeUp} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar planos, alunos..." className="field pl-10" />
        </motion.div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      )}

      {!loading && (
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PlanCard key={p.id} plan={p} isPersonal={isPersonal} readOnly={isOwner} onDelete={handleDelete} />
          ))}
        </motion.div>
      )}

      {!loading && filtered.length === 0 && plans.length === 0 && !(isPersonal && !hasStudents) && (
        <motion.div variants={fadeUp} className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <Salad className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-muted-foreground">
            {isStudent ? 'Nenhum plano atribuído ainda' : 'Nenhum plano alimentar criado'}
          </p>
          {isPersonal && hasStudents && (
            <Link href="/dietas/novo" className="btn-primary text-sm py-2 px-4 rounded-xl mt-4 inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Criar plano
            </Link>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

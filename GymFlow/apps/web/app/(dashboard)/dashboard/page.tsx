'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Activity, TrendingUp, Calendar, ArrowUpRight,
  Dumbbell, ChevronRight, Plus, UserPlus, Building2,
  ClipboardList, ArrowRight, Flame,
} from 'lucide-react'
import Link from 'next/link'

import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { FrequencyHeatmap } from '@/components/charts/frequency-heatmap'
import { createClient } from '@/lib/supabase/client'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  color,
  suffix = '',
  empty = false,
}: {
  label: string
  value: number
  delta?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  suffix?: string
  empty?: boolean
}) {
  return (
    <motion.div variants={fadeUp} className="stat-card group hover:border-brand-500/20 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}25` }}
        >
          <span style={{ color }}>
            <Icon className="w-4 h-4" />
          </span>
        </div>
        {delta && !empty && (
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
            delta.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
          )}>
            <ArrowUpRight className="w-3 h-3" />
            {delta}
          </span>
        )}
      </div>

      <div>
        <p className={cn('text-2xl font-display font-extrabold tracking-tight', empty && 'text-muted-foreground/40')}>
          {empty ? '—' : `${value}${suffix}`}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  ctaHref,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  cta: string
  ctaHref: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground/50" />
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">{description}</p>
      <Link href={ctaHref} className="btn-primary text-xs py-2 px-4 rounded-xl mt-4 inline-flex items-center gap-1.5">
        {cta} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

interface OwnerStats { totalStudents: number; sheetsCreated: number; workoutsToday: number }
interface StudentStats { totalWorkouts: number; weekWorkouts: number; streak: number; activeSheets: number }

export default function DashboardPage() {
  const { currentRole, profile, currentAcademy } = useAuthStore()
  const supabase = createClient()
  const isOwnerOrPersonal = currentRole === 'owner' || currentRole === 'personal'
  const isStudent = currentRole === 'student'

  const [ownerStats, setOwnerStats] = useState<OwnerStats>({ totalStudents: 0, sheetsCreated: 0, workoutsToday: 0 })
  const [studentStats, setStudentStats] = useState<StudentStats>({ totalWorkouts: 0, weekWorkouts: 0, streak: 0, activeSheets: 0 })

  useEffect(() => {
    if (!currentAcademy) return

    async function loadOwnerStats() {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const [{ count: students }, { count: sheets }, { count: workoutsToday }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('academy_members').select('id', { count: 'exact', head: true })
          .eq('academy_id', currentAcademy!.id).eq('role', 'student').eq('is_active', true),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('workout_sheets').select('id', { count: 'exact', head: true })
          .eq('academy_id', currentAcademy!.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('workout_logs').select('id', { count: 'exact', head: true })
          .eq('academy_id', currentAcademy!.id).gte('created_at', today.toISOString()),
      ])
      setOwnerStats({ totalStudents: students ?? 0, sheetsCreated: sheets ?? 0, workoutsToday: workoutsToday ?? 0 })
    }

    async function loadStudentStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
      const [{ count: total }, { count: week }, { count: sheets }] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('workout_logs').select('id', { count: 'exact', head: true })
          .eq('student_id', user.id).eq('academy_id', currentAcademy!.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('workout_logs').select('id', { count: 'exact', head: true })
          .eq('student_id', user.id).eq('academy_id', currentAcademy!.id).gte('created_at', weekAgo.toISOString()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('workout_sheets').select('id', { count: 'exact', head: true })
          .eq('student_id', user.id).eq('academy_id', currentAcademy!.id).eq('is_active', true),
      ])
      setStudentStats({ totalWorkouts: total ?? 0, weekWorkouts: week ?? 0, streak: 0, activeSheets: sheets ?? 0 })
    }

    if (isOwnerOrPersonal) loadOwnerStats()
    if (isStudent) loadStudentStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademy, currentRole])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const hasAcademy = !!currentAcademy
  const goalLabel = profile?.goal ?? null
  const weightLabel = profile?.weight_kg ? `${profile.weight_kg} kg` : null
  const heightLabel = profile?.height_cm ? `${profile.height_cm} cm` : null
  const experienceLabel = profile?.bio ?? null

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Welcome */}
      <motion.div variants={fadeUp}>
        <h2 className="text-2xl font-display font-bold">
          {greeting()}, {profile?.full_name?.split(' ')[0] ?? 'usuário'} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </motion.div>

      {/* Owner/Personal — sem academia criada */}
      {isOwnerOrPersonal && !hasAcademy && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-6 border border-brand-500/20 bg-brand-500/5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold">Configure sua academia</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie sua academia para convidar alunos e gerenciar treinos.
              </p>
              <Link href="/onboarding?type=owner" className="btn-primary text-xs py-2 px-4 rounded-xl mt-3 inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Criar academia
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Owner/Personal stats — com academia */}
      {isOwnerOrPersonal && hasAcademy && (
        <motion.div variants={stagger} className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Alunos ativos" value={ownerStats.totalStudents} icon={Users} color="#6366F1" empty={ownerStats.totalStudents === 0} />
          <StatCard label="Treinos hoje" value={ownerStats.workoutsToday} icon={Dumbbell} color="#10B981" empty={ownerStats.workoutsToday === 0} />
          <StatCard label="Fichas criadas" value={ownerStats.sheetsCreated} icon={ClipboardList} color="#F59E0B" empty={ownerStats.sheetsCreated === 0} />
          <StatCard label="Total de alunos" value={ownerStats.totalStudents} icon={Activity} color="#06B6D4" empty={ownerStats.totalStudents === 0} />
        </motion.div>
      )}

      {/* Student stats */}
      {isStudent && (
        <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Treinos totais" value={studentStats.totalWorkouts} icon={Dumbbell} color="#6366F1" empty={studentStats.totalWorkouts === 0} />
          <StatCard label="Semana atual" value={studentStats.weekWorkouts} icon={Calendar} color="#10B981" empty={studentStats.weekWorkouts === 0} />
          <StatCard label="Sequência" value={studentStats.streak} icon={Flame} color="#F97316" suffix="d" empty={studentStats.streak === 0} />
          <StatCard label="Fichas ativas" value={studentStats.activeSheets} icon={ClipboardList} color="#F59E0B" empty={studentStats.activeSheets === 0} />
        </motion.div>
      )}

      {/* Student — perfil incompleto */}
      {isStudent && !goalLabel && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Complete seu perfil</p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione suas características físicas para acompanhar sua evolução.
              </p>
              <Link href="/onboarding?type=student" className="text-xs text-amber-400 font-semibold flex items-center gap-1 mt-2 hover:underline">
                Completar agora <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Student — perfil preenchido */}
      {isStudent && goalLabel && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
          <h3 className="font-display font-bold text-sm mb-4">Meu perfil</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Objetivo', value: goalLabel },
              { label: 'Peso', value: weightLabel ?? '—' },
              { label: 'Altura', value: heightLabel ?? '—' },
              { label: 'Nível', value: experienceLabel ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-surface-100 text-center">
                <p className="font-bold text-sm">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <Link href="/configuracoes" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 mt-3">
            Editar perfil <ChevronRight className="w-3 h-3" />
          </Link>
        </motion.div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: empty state / content */}
        <motion.div variants={fadeUp} className="xl:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold">
                {isOwnerOrPersonal ? 'Frequência semanal' : 'Evolução de carga'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Últimas 8 semanas</p>
            </div>
          </div>

          {isOwnerOrPersonal && !hasAcademy ? (
            <EmptyState
              icon={Activity}
              title="Nenhum dado ainda"
              description="Crie sua academia e convide alunos para ver a frequência aqui."
              cta="Criar academia"
              ctaHref="/onboarding?type=owner"
            />
          ) : isOwnerOrPersonal && hasAcademy ? (
            <EmptyState
              icon={Users}
              title="Sem alunos ainda"
              description="Convide seus primeiros alunos para começar a acompanhar a frequência."
              cta="Convidar aluno"
              ctaHref="/alunos"
            />
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="Nenhum treino registrado"
              description="Complete seu primeiro treino para ver sua evolução de carga aqui."
              cta="Ver meus treinos"
              ctaHref="/treinos"
            />
          )}
        </motion.div>

        {/* Right column */}
        <motion.div variants={fadeUp} className="space-y-4">
          {/* Frequency heatmap */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm">Mapa de frequência</h3>
              <TrendingUp className="w-4 h-4 text-brand-400" />
            </div>
            <FrequencyHeatmap />
            <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-1">
                {['bg-surface-200', 'bg-brand-900', 'bg-brand-700', 'bg-brand-500', 'bg-brand-400'].map((c) => (
                  <div key={c} className={cn('w-2.5 h-2.5 rounded-sm', c)} />
                ))}
              </div>
              <span>Mais</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="glass rounded-2xl p-4 space-y-2">
            <h3 className="font-display font-bold text-sm mb-3">Ações rápidas</h3>
            {isOwnerOrPersonal ? (
              <>
                <Link href="/treinos/novo" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center group-hover:bg-brand-500/25 transition-all">
                    <Dumbbell className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <span className="text-sm font-medium flex-1">Nova ficha de treino</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Link>
                <Link href="/alunos" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center group-hover:bg-cyan-500/25 transition-all">
                    <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span className="text-sm font-medium flex-1">Convidar aluno</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Link>
                <Link href="/exercicios" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-all">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium flex-1">Banco de exercícios</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/treinos" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-all group bg-brand-500/8 border border-brand-500/20">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                    <Dumbbell className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-brand-300">Ver meus treinos</span>
                    <p className="text-[10px] text-muted-foreground">Fichas atribuídas pelo personal</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
                </Link>
                <Link href="/configuracoes" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/25 transition-all">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-sm font-medium flex-1">Atualizar meu perfil</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Owner: recent activity — empty state */}
      {isOwnerOrPersonal && hasAcademy && (
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm">Alunos recentes</h3>
              <Link href="/alunos" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Ver todos <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <EmptyState
              icon={Users}
              title="Nenhum aluno ainda"
              description="Convide seus primeiros alunos usando um link ou código."
              cta="Convidar aluno"
              ctaHref="/alunos"
            />
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm">Treinos recentes</h3>
              <Link href="/frequencia" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Ver todos <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <EmptyState
              icon={Dumbbell}
              title="Sem treinos registrados"
              description="Os treinos dos seus alunos aparecerão aqui conforme forem executados."
              cta="Criar ficha de treino"
              ctaHref="/treinos/novo"
            />
          </div>
        </motion.div>
      )}

      {/* No role — not in any academy */}
      {!currentRole && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-display font-bold">Você ainda não está em nenhuma academia</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
            Crie sua academia ou aceite um convite de um personal trainer para começar.
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href="/onboarding?type=owner" className="btn-primary text-sm py-2.5 px-5 rounded-xl">
              Criar academia
            </Link>
            <Link href="/convite" className="btn-secondary text-sm py-2.5 px-5 rounded-xl">
              Tenho um convite
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

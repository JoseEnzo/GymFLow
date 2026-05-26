'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Activity, TrendingUp, Calendar, ArrowUpRight,
  Dumbbell, ChevronRight, Plus, UserPlus, Building2,
  ClipboardList, ArrowRight, Flame, AlertTriangle, Clock,
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
  warning = false,
}: {
  label: string
  value: number
  delta?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  suffix?: string
  empty?: boolean
  warning?: boolean
}) {
  return (
    <motion.div variants={fadeUp} className={cn(
      'stat-card group transition-all duration-300 hover:-translate-y-0.5',
      warning ? 'hover:border-amber-500/30' : 'hover:border-brand-500/20',
    )}>
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
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
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

interface OwnerMetrics {
  totalStudents: number
  activeThisWeek: number
  inactiveCount: number
  workoutsThisWeek: number
  workoutsLastWeek: number
  newThisMonth: number
}

interface RecentMember {
  id: string
  userId: string
  joinedAt: string
  fullName: string
}

interface RecentWorkout {
  id: string
  createdAt: string
  studentName: string
  sheetName: string
  durationSeconds: number | null
}

interface StudentStats { totalWorkouts: number; weekWorkouts: number; streak: number; activeSheets: number }

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function computeStreak(timestamps: string[]): number {
  if (timestamps.length === 0) return 0
  const daySet = new Set(timestamps.map(t => dateKey(new Date(t))))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!daySet.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (daySet.has(dateKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function formatTimeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  if (days < 7) return `${days} dias atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

export default function DashboardPage() {
  const { currentRole, profile, currentAcademy } = useAuthStore()
  const supabase = createClient()
  const isOwnerOrPersonal = currentRole === 'owner' || currentRole === 'personal'
  const isStudent = currentRole === 'student'

  const [ownerMetrics, setOwnerMetrics] = useState<OwnerMetrics>({
    totalStudents: 0, activeThisWeek: 0, inactiveCount: 0,
    workoutsThisWeek: 0, workoutsLastWeek: 0, newThisMonth: 0,
  })
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([])
  const [studentStats, setStudentStats] = useState<StudentStats>({ totalWorkouts: 0, weekWorkouts: 0, streak: 0, activeSheets: 0 })

  useEffect(() => {
    if (!currentAcademy) return

    async function loadOwnerMetrics() {
      const academyId = currentAcademy!.id
      const now = new Date()
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
      const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)
      const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      const [
        { count: totalStudents },
        { data: weeklyLogs },
        { count: workoutsLastWeek },
        { count: newThisMonth },
        { data: recentMembersRaw },
        { data: recentWorkoutsRaw },
      ] = await Promise.all([
        sb.from('academy_members')
          .select('id', { count: 'exact', head: true })
          .eq('academy_id', academyId).eq('role', 'student').eq('is_active', true),

        sb.from('workout_logs')
          .select('student_id')
          .eq('academy_id', academyId)
          .gte('created_at', weekAgo.toISOString()),

        sb.from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('academy_id', academyId)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', weekAgo.toISOString()),

        sb.from('academy_members')
          .select('id', { count: 'exact', head: true })
          .eq('academy_id', academyId).eq('role', 'student')
          .gte('joined_at', monthAgo.toISOString()),

        sb.from('academy_members')
          .select('id, joined_at, user_id')
          .eq('academy_id', academyId).eq('role', 'student').eq('is_active', true)
          .order('joined_at', { ascending: false })
          .limit(5),

        sb.from('workout_logs')
          .select('id, created_at, student_id, duration_seconds, sheet_id')
          .eq('academy_id', academyId)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const activeStudentIds = new Set((weeklyLogs ?? []).map((l: { student_id: string }) => l.student_id))
      const activeThisWeek = activeStudentIds.size
      const total = totalStudents ?? 0

      setOwnerMetrics({
        totalStudents: total,
        activeThisWeek,
        inactiveCount: Math.max(0, total - activeThisWeek),
        workoutsThisWeek: weeklyLogs?.length ?? 0,
        workoutsLastWeek: workoutsLastWeek ?? 0,
        newThisMonth: newThisMonth ?? 0,
      })

      // Fetch profiles e fichas em paralelo
      const memberUserIds: string[] = (recentMembersRaw ?? []).map((m: { user_id: string }) => m.user_id)
      const workoutStudentIds: string[] = [...new Set((recentWorkoutsRaw ?? []).map((w: { student_id: string }) => w.student_id))]
      const sheetIds: string[] = (recentWorkoutsRaw ?? []).map((w: { sheet_id: string }) => w.sheet_id).filter(Boolean)
      const allUserIds = [...new Set([...memberUserIds, ...workoutStudentIds])]

      const [{ data: profiles }, { data: sheets }] = await Promise.all([
        allUserIds.length > 0
          ? sb.from('profiles').select('id, full_name').in('id', allUserIds)
          : { data: [] },
        sheetIds.length > 0
          ? sb.from('workout_sheets').select('id, name').in('id', sheetIds)
          : { data: [] },
      ])

      const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p]))
      const sheetMap = new Map((sheets ?? []).map((s: { id: string; name: string }) => [s.id, s]))

      setRecentMembers((recentMembersRaw ?? []).map((m: { id: string; user_id: string; joined_at: string }) => ({
        id: m.id,
        userId: m.user_id,
        joinedAt: m.joined_at,
        fullName: (profileMap.get(m.user_id) as { full_name: string } | undefined)?.full_name ?? 'Usuário',
      })))

      setRecentWorkouts((recentWorkoutsRaw ?? []).map((w: { id: string; created_at: string; student_id: string; sheet_id: string; duration_seconds: number | null }) => ({
        id: w.id,
        createdAt: w.created_at,
        studentName: (profileMap.get(w.student_id) as { full_name: string } | undefined)?.full_name ?? 'Aluno',
        sheetName: (sheetMap.get(w.sheet_id) as { name: string } | undefined)?.name ?? 'Treino',
        durationSeconds: w.duration_seconds,
      })))
    }

    async function loadStudentStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const [{ count: total }, { count: week }, { count: sheets }, { data: logDates }] = await Promise.all([
        sb.from('workout_logs').select('id', { count: 'exact', head: true })
          .eq('student_id', user.id).eq('academy_id', currentAcademy!.id),
        sb.from('workout_logs').select('id', { count: 'exact', head: true })
          .eq('student_id', user.id).eq('academy_id', currentAcademy!.id).gte('created_at', weekAgo.toISOString()),
        sb.from('workout_sheets').select('id', { count: 'exact', head: true })
          .eq('student_id', user.id).eq('academy_id', currentAcademy!.id).eq('is_active', true),
        sb.from('workout_logs').select('created_at')
          .eq('student_id', user.id).eq('academy_id', currentAcademy!.id),
      ])
      const streak = computeStreak((logDates ?? []).map((r: { created_at: string }) => r.created_at))
      setStudentStats({ totalWorkouts: total ?? 0, weekWorkouts: week ?? 0, streak, activeSheets: sheets ?? 0 })
    }

    if (isOwnerOrPersonal) loadOwnerMetrics()
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

  const engagementPct = ownerMetrics.totalStudents > 0
    ? Math.round((ownerMetrics.activeThisWeek / ownerMetrics.totalStudents) * 100)
    : 0

  const weekDelta = ownerMetrics.workoutsLastWeek > 0
    ? `${ownerMetrics.workoutsThisWeek >= ownerMetrics.workoutsLastWeek ? '+' : ''}${ownerMetrics.workoutsThisWeek - ownerMetrics.workoutsLastWeek}`
    : undefined

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

      {/* Owner/Personal stats */}
      {isOwnerOrPersonal && hasAcademy && (
        <motion.div variants={stagger} className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Alunos ativos"
            value={ownerMetrics.totalStudents}
            delta={ownerMetrics.newThisMonth > 0 ? `+${ownerMetrics.newThisMonth} este mês` : undefined}
            icon={Users}
            color="#6366F1"
            empty={ownerMetrics.totalStudents === 0}
          />
          <StatCard
            label="Treinos esta semana"
            value={ownerMetrics.workoutsThisWeek}
            delta={weekDelta}
            icon={Dumbbell}
            color="#10B981"
            empty={ownerMetrics.workoutsThisWeek === 0}
          />
          <StatCard
            label="Engajamento semanal"
            value={engagementPct}
            suffix="%"
            icon={Activity}
            color="#06B6D4"
            empty={ownerMetrics.totalStudents === 0}
          />
          <StatCard
            label={ownerMetrics.inactiveCount > 0 ? `Inativos (+7 dias)` : 'Todos ativos'}
            value={ownerMetrics.inactiveCount}
            icon={AlertTriangle}
            color={ownerMetrics.inactiveCount > 0 ? '#F59E0B' : '#10B981'}
            warning={ownerMetrics.inactiveCount > 0}
            empty={ownerMetrics.totalStudents === 0}
          />
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
              <TrendingUp className="w-4 h-4 text-amber-400" />
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

        {/* Left: treinos recentes (owner) ou evolução (student) */}
        <motion.div variants={fadeUp} className="xl:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold">
                {isOwnerOrPersonal ? 'Treinos recentes' : 'Evolução de carga'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isOwnerOrPersonal ? 'Últimas sessões da academia' : 'Últimas 8 semanas'}
              </p>
            </div>
            {isOwnerOrPersonal && recentWorkouts.length > 0 && (
              <Link href="/frequencia" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Ver todos <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {isOwnerOrPersonal && !hasAcademy ? (
            <EmptyState
              icon={Activity}
              title="Nenhum dado ainda"
              description="Crie sua academia e convide alunos para ver a frequência aqui."
              cta="Criar academia"
              ctaHref="/onboarding?type=owner"
            />
          ) : isOwnerOrPersonal && recentWorkouts.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum treino registrado"
              description="Quando seus alunos completarem treinos, eles aparecerão aqui."
              cta="Convidar aluno"
              ctaHref="/alunos"
            />
          ) : isOwnerOrPersonal ? (
            <div className="space-y-2">
              {recentWorkouts.map((w) => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{w.studentName}</p>
                    <p className="text-xs text-muted-foreground truncate">{w.sheetName}</p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-0.5">
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(w.createdAt)}</p>
                    {w.durationSeconds != null && (
                      <p className="text-xs font-medium flex items-center gap-1 justify-end text-brand-400">
                        <Clock className="w-3 h-3" />
                        {formatDuration(w.durationSeconds)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

      {/* Owner: alunos recentes + inativos */}
      {isOwnerOrPersonal && hasAcademy && (
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Alunos recentes */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm">Alunos recentes</h3>
              <Link href="/alunos" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Ver todos <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {recentMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum aluno ainda"
                description="Convide seus primeiros alunos usando um link ou código."
                cta="Convidar aluno"
                ctaHref="/alunos"
              />
            ) : (
              <div className="space-y-2">
                {recentMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-400">
                        {m.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.fullName}</p>
                      <p className="text-xs text-muted-foreground">Entrou {formatTimeAgo(m.joinedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alunos inativos */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm">Sem treino esta semana</h3>
                {ownerMetrics.inactiveCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                    {ownerMetrics.inactiveCount}
                  </span>
                )}
              </div>
              <Link href="/alunos" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                Ver alunos <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {ownerMetrics.totalStudents === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title="Sem alunos cadastrados"
                description="Convide alunos para acompanhar o engajamento da academia."
                cta="Convidar aluno"
                ctaHref="/alunos"
              />
            ) : ownerMetrics.inactiveCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-emerald-400">100% de engajamento</p>
                  <p className="text-xs text-muted-foreground mt-1">Todos os alunos treinaram esta semana.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">
                    <span className="font-bold">{ownerMetrics.inactiveCount}</span> de{' '}
                    <span className="font-bold">{ownerMetrics.totalStudents}</span> alunos não treinaram nos últimos 7 dias.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-surface-100 text-center">
                  <p className="text-2xl font-display font-extrabold">{engagementPct}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">taxa de engajamento</p>
                  <div className="mt-2 h-1.5 rounded-full bg-surface-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-700"
                      style={{ width: `${engagementPct}%` }}
                    />
                  </div>
                </div>
                <Link href="/alunos" className="flex items-center justify-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium py-1">
                  Enviar lembrete aos inativos <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* No role */}
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

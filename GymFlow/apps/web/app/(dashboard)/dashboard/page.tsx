'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Users, Activity, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight,
  Dumbbell, ChevronRight, Plus, UserPlus, Building2,
  ClipboardList, ArrowRight, Flame, AlertTriangle, Clock, Play, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { FrequencyHeatmap } from '@/components/charts/frequency-heatmap'
import { createClient } from '@/lib/supabase/client'
import { StudentBioView } from '@/components/bioimpedance/student-bio-view'

// ── Animations ───────────────────────────────────────────────
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

// ── Components ───────────────────────────────────────────────
function StatCard({
  label, value, delta, icon: Icon, color, suffix = '', empty = false, warning = false,
}: {
  label: string; value: number; delta?: string
  icon: React.ComponentType<{ className?: string }>
  color: string; suffix?: string; empty?: boolean; warning?: boolean
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
          <span style={{ color }}><Icon className="w-4 h-4" /></span>
        </div>
        {delta && !empty && (
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
            delta.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
          )}>
            {delta.startsWith('-') ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
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
  icon: Icon, title, description, cta, ctaHref,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string; description: string; cta: string; ctaHref: string
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

// ── Types ────────────────────────────────────────────────────
interface OwnerMetrics {
  totalStudents: number; activeThisWeek: number; activeLastWeek: number
  inactiveCount: number; workoutsThisWeek: number; workoutsLastWeek: number; newThisMonth: number
}
interface RecentMember { id: string; userId: string; joinedAt: string; fullName: string }
interface RecentWorkout {
  id: string; createdAt: string; studentName: string; sheetName: string; durationSeconds: number | null
}
interface InactiveStudent { userId: string; fullName: string; lastWorkoutAt: string | null }
interface WeeklyChartPoint { week: string; workouts: number; activeStudents: number }
interface StudentStats {
  totalWorkouts: number; weekWorkouts: number; lastWeekWorkouts: number; streak: number; activeSheets: number
}
interface TodayWorkout { id: string; name: string; goal: string | null; exerciseCount: number; alreadyDone: boolean }

interface OwnerDashboardData {
  metrics: OwnerMetrics
  recentMembers: RecentMember[]
  recentWorkouts: RecentWorkout[]
  weeklyChartData: WeeklyChartPoint[]
  inactiveStudents: InactiveStudent[]
}

interface StudentDashboardData {
  stats: StudentStats
  workoutDates: string[]
  todayWorkout: TodayWorkout | null
}

// ── Constants ────────────────────────────────────────────────
const BADGES: Array<{ id: string; icon: string; label: string; desc: string; condition: (w: number, s: number) => boolean }> = [
  { id: 'first',    icon: '🥉', label: 'Primeira pedrada', desc: '1 treino',         condition: (w) => w >= 1   },
  { id: 'five',     icon: '🥈', label: 'Constante',         desc: '5 treinos',        condition: (w) => w >= 5   },
  { id: 'ten',      icon: '🥇', label: 'Dedicado',          desc: '10 treinos',       condition: (w) => w >= 10  },
  { id: 'thirty',   icon: '💎', label: 'Veterano',          desc: '30 treinos',       condition: (w) => w >= 30  },
  { id: 'streak3',  icon: '🔥', label: 'Em chamas',         desc: '3 dias seguidos',  condition: (_w, s) => s >= 3  },
  { id: 'streak7',  icon: '⚡', label: 'Inabalável',        desc: '7 dias seguidos',  condition: (_w, s) => s >= 7  },
  { id: 'streak14', icon: '🏆', label: 'Imparável',         desc: '14 dias seguidos', condition: (_w, s) => s >= 14 },
]

// ── Helpers ──────────────────────────────────────────────────
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
  while (daySet.has(dateKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1) }
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

function getWeekStart(date: Date): string {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

// ── Data fetchers ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchOwnerDashboard(academyId: string, sb: any): Promise<OwnerDashboardData> {
  const now = new Date()
  const weekAgo     = new Date(now); weekAgo.setDate(now.getDate() - 7)
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)
  const monthAgo    = new Date(now); monthAgo.setDate(now.getDate() - 30)

  const [
    { count: totalStudents },
    { data: weeklyLogs },
    { data: lastWeekLogs },
    { count: newThisMonth },
    { data: recentMembersRaw },
    { data: recentWorkoutsRaw },
    { data: allStudentsRaw },
    { data: chartLogsRaw },
  ] = await Promise.all([
    sb.from('academy_members')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId).eq('role', 'student').eq('is_active', true),

    sb.from('workout_logs')
      .select('student_id')
      .eq('academy_id', academyId)
      .gte('created_at', weekAgo.toISOString()),

    sb.from('workout_logs')
      .select('student_id')
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

    sb.from('academy_members')
      .select('user_id')
      .eq('academy_id', academyId).eq('role', 'student').eq('is_active', true)
      .limit(60),

    sb.from('workout_logs')
      .select('created_at, student_id')
      .eq('academy_id', academyId)
      .gte('created_at', new Date(Date.now() - 56 * 86400000).toISOString())
      .order('created_at', { ascending: true }),
  ])

  const activeStudentIds  = new Set((weeklyLogs ?? []).map((l: { student_id: string }) => l.student_id))
  const activeLastWeekIds = new Set((lastWeekLogs ?? []).map((l: { student_id: string }) => l.student_id))
  const activeThisWeek    = activeStudentIds.size
  const total             = totalStudents ?? 0

  const metrics: OwnerMetrics = {
    totalStudents: total,
    activeThisWeek,
    activeLastWeek: activeLastWeekIds.size,
    inactiveCount: Math.max(0, total - activeThisWeek),
    workoutsThisWeek: weeklyLogs?.length ?? 0,
    workoutsLastWeek: lastWeekLogs?.length ?? 0,
    newThisMonth: newThisMonth ?? 0,
  }

  // Weekly chart
  const byWeek: Record<string, { workouts: number; students: Set<string> }> = {}
  for (const log of (chartLogsRaw ?? [])) {
    const label = getWeekStart(new Date(log.created_at))
    if (!byWeek[label]) byWeek[label] = { workouts: 0, students: new Set() }
    byWeek[label].workouts++
    byWeek[label].students.add(log.student_id)
  }
  const weeklyChartData = Object.entries(byWeek).map(([week, v]) => ({
    week, workouts: v.workouts, activeStudents: v.students.size,
  }))

  // Profiles batch
  const allStudentIds: string[] = (allStudentsRaw ?? []).map((m: { user_id: string }) => m.user_id)
  const inactiveIds             = allStudentIds.filter(id => !activeStudentIds.has(id))
  const memberUserIds: string[] = (recentMembersRaw ?? []).map((m: { user_id: string }) => m.user_id)
  const workoutsRaw             = (recentWorkoutsRaw ?? []) as Array<{ student_id: string; sheet_id: string }>
  const workoutStudentIds       = [...new Set(workoutsRaw.map(w => w.student_id))]
  const sheetIds                = workoutsRaw.map(w => w.sheet_id).filter(Boolean)
  const allUserIds              = [...new Set([...memberUserIds, ...workoutStudentIds, ...inactiveIds])]

  const [{ data: profiles }, { data: sheets }] = await Promise.all([
    allUserIds.length > 0
      ? sb.from('profiles').select('id, full_name').in('id', allUserIds)
      : { data: [] },
    sheetIds.length > 0
      ? sb.from('workout_sheets').select('id, name').in('id', sheetIds)
      : { data: [] },
  ])

  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p]))
  const sheetMap   = new Map((sheets ?? []).map((s: { id: string; name: string }) => [s.id, s]))

  const recentMembers: RecentMember[] = (recentMembersRaw ?? []).map(
    (m: { id: string; user_id: string; joined_at: string }) => ({
      id: m.id, userId: m.user_id, joinedAt: m.joined_at,
      fullName: (profileMap.get(m.user_id) as { full_name: string } | undefined)?.full_name ?? 'Usuário',
    })
  )

  const recentWorkouts: RecentWorkout[] = (recentWorkoutsRaw ?? []).map(
    (w: { id: string; created_at: string; student_id: string; sheet_id: string; duration_seconds: number | null }) => ({
      id: w.id, createdAt: w.created_at,
      studentName: (profileMap.get(w.student_id) as { full_name: string } | undefined)?.full_name ?? 'Aluno',
      sheetName:   (sheetMap.get(w.sheet_id)     as { name: string }       | undefined)?.name      ?? 'Treino',
      durationSeconds: w.duration_seconds,
    })
  )

  // Inactive students with last workout date
  let inactiveStudents: InactiveStudent[] = []
  if (inactiveIds.length > 0) {
    const { data: lastWorkouts } = await sb
      .from('workout_logs')
      .select('student_id, created_at')
      .eq('academy_id', academyId)
      .in('student_id', inactiveIds)
      .order('created_at', { ascending: false })

    const lastWorkoutMap = new Map<string, string>()
    for (const log of (lastWorkouts ?? [])) {
      if (!lastWorkoutMap.has(log.student_id)) lastWorkoutMap.set(log.student_id, log.created_at)
    }

    inactiveStudents = inactiveIds.slice(0, 8).map((id: string) => ({
      userId: id,
      fullName: (profileMap.get(id) as { full_name: string } | undefined)?.full_name ?? 'Aluno',
      lastWorkoutAt: lastWorkoutMap.get(id) ?? null,
    }))
  }

  return { metrics, recentMembers, recentWorkouts, weeklyChartData, inactiveStudents }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchStudentDashboard(userId: string, academyId: string, sb: any): Promise<StudentDashboardData> {
  const weekAgo     = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const [{ count: total }, { count: week }, { count: lastWeek }, { count: sheets }, { data: logDates }] = await Promise.all([
    sb.from('workout_logs').select('id', { count: 'exact', head: true })
      .eq('student_id', userId).eq('academy_id', academyId),
    sb.from('workout_logs').select('id', { count: 'exact', head: true })
      .eq('student_id', userId).eq('academy_id', academyId).gte('created_at', weekAgo.toISOString()),
    sb.from('workout_logs').select('id', { count: 'exact', head: true })
      .eq('student_id', userId).eq('academy_id', academyId)
      .gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', weekAgo.toISOString()),
    sb.from('workout_sheets').select('id', { count: 'exact', head: true })
      .eq('student_id', userId).eq('academy_id', academyId).eq('is_active', true),
    sb.from('workout_logs').select('created_at')
      .eq('student_id', userId).eq('academy_id', academyId),
  ])

  const allDates = (logDates ?? []).map((r: { created_at: string }) => r.created_at)
  const stats: StudentStats = {
    totalWorkouts: total ?? 0,
    weekWorkouts: week ?? 0,
    lastWeekWorkouts: lastWeek ?? 0,
    streak: computeStreak(allDates),
    activeSheets: sheets ?? 0,
  }

  // Today's scheduled workout
  const todayIndex = new Date().getDay()
  const todayStr   = dateKey(new Date())
  const { data: scheduledSheet } = await sb
    .from('workout_sheets')
    .select('id, name, goal, scheduled_days, sheet_exercises(id)')
    .eq('student_id', userId).eq('academy_id', academyId).eq('is_active', true)
    .contains('scheduled_days', [todayIndex])
    .limit(1).maybeSingle()

  let todayWorkout: TodayWorkout | null = null
  if (scheduledSheet) {
    const { data: completion } = await sb
      .from('agenda_completions').select('id')
      .eq('sheet_id', scheduledSheet.id).eq('student_id', userId).eq('completed_on', todayStr)
      .maybeSingle()

    todayWorkout = {
      id: scheduledSheet.id, name: scheduledSheet.name, goal: scheduledSheet.goal ?? null,
      exerciseCount: scheduledSheet.sheet_exercises?.length ?? 0,
      alreadyDone: !!completion,
    }
  }

  return { stats, workoutDates: allDates, todayWorkout }
}

// ── Default values ────────────────────────────────────────────
const DEFAULT_OWNER_METRICS: OwnerMetrics = {
  totalStudents: 0, activeThisWeek: 0, activeLastWeek: 0,
  inactiveCount: 0, workoutsThisWeek: 0, workoutsLastWeek: 0, newThisMonth: 0,
}
const DEFAULT_STUDENT_STATS: StudentStats = {
  totalWorkouts: 0, weekWorkouts: 0, lastWeekWorkouts: 0, streak: 0, activeSheets: 0,
}

// ── Page ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const { currentRole, profile, currentAcademy } = useAuthStore()
  const supabase = createClient()
  const isOwnerOrPersonal = currentRole === 'owner' || currentRole === 'personal'
  const isStudent         = currentRole === 'student'

  // Owner/Personal data — cached 5 minutes
  const { data: ownerData } = useQuery({
    queryKey: ['owner-dashboard', currentAcademy?.id],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: () => fetchOwnerDashboard(currentAcademy!.id, supabase as any),
    enabled: isOwnerOrPersonal && !!currentAcademy,
    staleTime: 5 * 60 * 1000,
  })

  // Student data — cached 2 minutes
  const { data: studentData } = useQuery({
    queryKey: ['student-dashboard', currentAcademy?.id, profile?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('unauthenticated')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return fetchStudentDashboard(user.id, currentAcademy!.id, supabase as any)
    },
    enabled: isStudent && !!currentAcademy,
    staleTime: 2 * 60 * 1000,
  })

  // Derived — same names so JSX below is unchanged
  const ownerMetrics       = ownerData?.metrics        ?? DEFAULT_OWNER_METRICS
  const recentMembers      = ownerData?.recentMembers  ?? []
  const recentWorkouts     = ownerData?.recentWorkouts ?? []
  const weeklyChartData    = ownerData?.weeklyChartData ?? []
  const inactiveStudents   = ownerData?.inactiveStudents ?? []
  const studentStats       = studentData?.stats         ?? DEFAULT_STUDENT_STATS
  const studentWorkoutDates = studentData?.workoutDates ?? []
  const todayWorkout        = studentData?.todayWorkout ?? null

  // ── Computed display values ───────────────────────────────────
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const hasAcademy       = !!currentAcademy
  const goalLabel        = profile?.goal ?? null
  const weightLabel      = profile?.weight_kg  ? `${profile.weight_kg} kg`   : null
  const heightLabel      = profile?.height_cm  ? `${profile.height_cm} cm`   : null
  const experienceLabel  = profile?.bio ?? null

  const engagementPct = ownerMetrics.totalStudents > 0
    ? Math.round((ownerMetrics.activeThisWeek / ownerMetrics.totalStudents) * 100) : 0
  const engagementLastWeekPct = ownerMetrics.totalStudents > 0
    ? Math.round((ownerMetrics.activeLastWeek / ownerMetrics.totalStudents) * 100) : 0
  const engagementDelta = ownerMetrics.totalStudents > 0 && (engagementPct > 0 || engagementLastWeekPct > 0)
    ? `${engagementPct >= engagementLastWeekPct ? '+' : ''}${engagementPct - engagementLastWeekPct}%`
    : undefined
  const weekDelta = ownerMetrics.workoutsLastWeek > 0
    ? `${ownerMetrics.workoutsThisWeek >= ownerMetrics.workoutsLastWeek ? '+' : ''}${ownerMetrics.workoutsThisWeek - ownerMetrics.workoutsLastWeek}`
    : undefined
  const studentWeekDelta = studentStats.lastWeekWorkouts > 0 || studentStats.weekWorkouts > 0
    ? `${studentStats.weekWorkouts >= studentStats.lastWeekWorkouts ? '+' : ''}${studentStats.weekWorkouts - studentStats.lastWeekWorkouts}`
    : undefined

  // ── Render ───────────────────────────────────────────────────
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
            icon={Users} color="#6366F1"
            empty={ownerMetrics.totalStudents === 0}
          />
          <StatCard
            label="Treinos esta semana" value={ownerMetrics.workoutsThisWeek} delta={weekDelta}
            icon={Dumbbell} color="#10B981" empty={ownerMetrics.workoutsThisWeek === 0}
          />
          <StatCard
            label="Engajamento semanal" value={engagementPct} suffix="%" delta={engagementDelta}
            icon={Activity} color="#06B6D4" empty={ownerMetrics.totalStudents === 0}
          />
          <StatCard
            label={ownerMetrics.inactiveCount > 0 ? 'Inativos (+7 dias)' : 'Todos ativos'}
            value={ownerMetrics.inactiveCount}
            icon={AlertTriangle}
            color={ownerMetrics.inactiveCount > 0 ? '#F59E0B' : '#10B981'}
            warning={ownerMetrics.inactiveCount > 0}
            empty={ownerMetrics.totalStudents === 0}
          />
        </motion.div>
      )}

      {/* Owner/Personal — Weekly charts */}
      {isOwnerOrPersonal && hasAcademy && weeklyChartData.length > 1 && (
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Treinos por semana */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-brand-400" />
              <h3 className="font-display font-bold text-sm">Treinos por semana</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Últimas 8 semanas</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="workouts" name="Treinos" fill="#1D9E75" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Alunos ativos por semana */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="font-display font-bold text-sm">Alunos ativos por semana</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Únicos que treinaram</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={weeklyChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradActiveStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                  cursor={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <Area
                  type="monotone" dataKey="activeStudents" name="Alunos ativos"
                  stroke="#6366F1" strokeWidth={2} fill="url(#gradActiveStudents)"
                  dot={{ fill: '#6366F1', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: '#818CF8', r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </motion.div>
      )}

      {/* Student stats */}
      {isStudent && (
        <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Treinos totais"  value={studentStats.totalWorkouts} icon={Dumbbell}       color="#6366F1" empty={studentStats.totalWorkouts === 0} />
          <StatCard label="Semana atual"    value={studentStats.weekWorkouts}  delta={studentWeekDelta} icon={Calendar} color="#10B981" empty={studentStats.weekWorkouts === 0} />
          <StatCard label="Sequência"       value={studentStats.streak}        icon={Flame}          color="#F97316" suffix="d" empty={studentStats.streak === 0} />
          <StatCard label="Fichas ativas"   value={studentStats.activeSheets}  icon={ClipboardList}  color="#F59E0B" empty={studentStats.activeSheets === 0} />
        </motion.div>
      )}

      {/* Student — treino de hoje */}
      {isStudent && todayWorkout && (
        <motion.div variants={fadeUp} className={cn(
          'glass rounded-2xl p-5 border',
          todayWorkout.alreadyDone ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-brand-500/20 bg-brand-500/5',
        )}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                todayWorkout.alreadyDone ? 'bg-emerald-500/15' : 'bg-brand-500/15',
              )}>
                {todayWorkout.alreadyDone
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  : <Dumbbell className="w-5 h-5 text-brand-400" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium mb-0.5">
                  {todayWorkout.alreadyDone ? 'Treino de hoje — concluído 💪' : 'Treino de hoje'}
                </p>
                <p className="font-display font-bold text-sm leading-snug truncate">{todayWorkout.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {todayWorkout.exerciseCount} exercícios{todayWorkout.goal ? ` · ${todayWorkout.goal}` : ''}
                </p>
              </div>
            </div>
            {!todayWorkout.alreadyDone && (
              <Link
                href={`/treinos/executar/${todayWorkout.id}`}
                className="flex-shrink-0 flex items-center gap-1.5 btn-primary text-xs py-2.5 px-4 rounded-xl"
              >
                <Play className="w-3.5 h-3.5" /> Iniciar
              </Link>
            )}
          </div>
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
              { label: 'Peso',     value: weightLabel      ?? '—' },
              { label: 'Altura',   value: heightLabel      ?? '—' },
              { label: 'Nível',    value: experienceLabel  ?? '—' },
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

      {/* Student — conquistas */}
      {isStudent && studentStats.totalWorkouts > 0 && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
          <h3 className="font-display font-bold text-sm mb-4">Conquistas</h3>
          <div className="flex flex-wrap gap-2">
            {BADGES.map((badge) => {
              const earned = badge.condition(studentStats.totalWorkouts, studentStats.streak)
              return (
                <div
                  key={badge.id}
                  title={earned ? badge.desc : `${badge.desc} para desbloquear`}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all',
                    earned
                      ? 'bg-brand-500/10 border-brand-500/20'
                      : 'bg-surface-100 border-surface-200 opacity-40 grayscale',
                  )}
                >
                  <span className="text-base leading-none">{badge.icon}</span>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{badge.label}</p>
                    <p className="text-[10px] text-muted-foreground">{badge.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Student — bioimpedância & medidas */}
      {!isOwnerOrPersonal && profile && (
        <motion.div variants={fadeUp}>
          <StudentBioView studentId={profile.id} />
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
              icon={Activity} title="Nenhum dado ainda"
              description="Crie sua academia e convide alunos para ver a frequência aqui."
              cta="Criar academia" ctaHref="/onboarding?type=owner"
            />
          ) : isOwnerOrPersonal && recentWorkouts.length === 0 ? (
            <EmptyState
              icon={Users} title="Nenhum treino registrado"
              description="Quando seus alunos completarem treinos, eles aparecerão aqui."
              cta="Convidar aluno" ctaHref="/alunos"
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
                        <Clock className="w-3 h-3" /> {formatDuration(w.durationSeconds)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Dumbbell} title="Nenhum treino registrado"
              description="Complete seu primeiro treino para ver sua evolução de carga aqui."
              cta="Ver meus treinos" ctaHref="/treinos"
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
            <FrequencyHeatmap dates={isStudent ? studentWorkoutDates : undefined} />
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
                icon={Users} title="Nenhum aluno ainda"
                description="Convide seus primeiros alunos usando um link ou código."
                cta="Convidar aluno" ctaHref="/alunos"
              />
            ) : (
              <div className="space-y-2">
                {recentMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-400">{m.fullName.charAt(0).toUpperCase()}</span>
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
                icon={Dumbbell} title="Sem alunos cadastrados"
                description="Convide alunos para acompanhar o engajamento da academia."
                cta="Convidar aluno" ctaHref="/alunos"
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
              <div className="space-y-2">
                {inactiveStudents.length > 0 ? (
                  <div className="space-y-1.5">
                    {inactiveStudents.slice(0, 5).map((s) => (
                      <div key={s.userId} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-amber-400">{s.fullName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{s.fullName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {s.lastWorkoutAt ? `Último: ${formatTimeAgo(s.lastWorkoutAt)}` : 'Nunca treinou'}
                          </p>
                        </div>
                        <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      </div>
                    ))}
                    {inactiveStudents.length > 5 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-1">
                        e mais {inactiveStudents.length - 5} alunos
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-300">
                      <span className="font-bold">{ownerMetrics.inactiveCount}</span> alunos não treinaram nos últimos 7 dias.
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-surface-100 text-center">
                  <p className="text-2xl font-display font-extrabold">{engagementPct}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">taxa de engajamento</p>
                  <div className="mt-2 h-1.5 rounded-full bg-surface-200 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${engagementPct}%` }} />
                  </div>
                </div>
                <Link href="/alunos" className="flex items-center justify-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium py-1">
                  Ver detalhes <ArrowRight className="w-3 h-3" />
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

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  Users, Activity, TrendingUp, Calendar,
  Dumbbell, ChevronRight, Plus, UserPlus, Building2,
  ClipboardList, Flame, AlertTriangle, Clock, Play, CheckCircle2,
  ShieldCheck, BarChart3, BookOpen, CalendarCheck, Trophy, Timer, Check,
  Video, Loader2, Settings,
} from 'lucide-react'

import {
  stagger, fadeUp, dateKey, computeStreak, formatTimeAgo, formatDuration,
  StatCard, EmptyState, AlertBanner, QuickAction,
} from './_components'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

import { toast } from 'sonner'

import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
// Pesos: heatmap + bio-view só carregam quando a respectiva seção renderiza.
// Reduz JS inicial e tempo de compile em dev.
const FrequencyHeatmap = dynamic(
  () => import('@/components/charts/frequency-heatmap').then((m) => m.FrequencyHeatmap),
  { ssr: false, loading: () => <div className="h-32 rounded-xl bg-surface-100 animate-pulse" /> }
)
const StudentBioView = dynamic(
  () => import('@/components/bioimpedance/student-bio-view').then((m) => m.StudentBioView),
  { ssr: false, loading: () => <div className="h-48 rounded-xl bg-surface-100 animate-pulse" /> }
)
import { Skeleton } from '@/components/ui/skeleton'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface OwnerMetrics {
  totalStudents: number; activePersonals: number; activeThisWeek: number
  inactiveCount: number; workoutsThisWeek: number; workoutsLastWeek: number
  newThisMonth: number; studentsWithoutSheets: number
}
interface PersonalMetrics {
  myStudentsCount: number; trainedTodayCount: number
  activeSheetsCount: number; inactiveCount: number
}
interface RecentMember   { id: string; userId: string; joinedAt: string; fullName: string }
interface RecentWorkout  { id: string; createdAt: string; studentName: string; sheetName: string; durationSeconds: number | null }
interface InactiveStudent{ userId: string; fullName: string; lastWorkoutAt: string | null }
interface MyStudent      { userId: string; fullName: string; lastWorkoutAt: string | null; activeSheets: number; trainedToday: boolean }
interface PersonalPerf   { userId: string; fullName: string; studentCount: number }
interface StudentStats   { totalWorkouts: number; weekWorkouts: number; streak: number; activeSheets: number; weekGoal: number }
interface TodayWorkout   { id: string; name: string; goal: string | null; exerciseCount: number; alreadyDone: boolean }
interface LastWorkoutSummary { sheetName: string; durationSeconds: number | null; createdAt: string }
interface NextWorkout    { id: string; name: string; goal: string | null; exerciseCount: number; dayLabel: string }
interface MonthlyWorkout { month: string; count: number }


const OWNER_PLAN_INFO: Record<string, { name: string; color: string; emoji: string; price: string; trial?: boolean; features: string[] }> = {
  personal: { name: 'Personal', color: '#10B981', emoji: '🏋️', price: 'R$ 97/mês',  trial: true, features: ['Alunos ilimitados', 'Fichas de treino ilimitadas', 'Histórico e evolução por aluno', 'Convites por código', 'Dashboard completo'] },
  starter:  { name: 'Starter',  color: '#06B6D4', emoji: '⚡', price: 'R$ 197/mês', trial: true,  features: ['Até 50 alunos', 'Até 3 personais', 'Fichas ilimitadas', 'Dashboard básico', 'Convites por código'] },
  pro:      { name: 'Pro',      color: '#10B981', emoji: '👑', price: 'R$ 397/mês',               features: ['Alunos ilimitados', 'Personais ilimitados', 'Relatórios avançados', 'Mapa de frequência detalhado', 'Exportar dados (CSV)', 'Notificações de inatividade', 'Personalização da academia', 'Histórico completo por aluno', 'Suporte prioritário'] },
}

const PRO_UPGRADE_FEATURES = [
  'Alunos ilimitados (Starter: até 50)',
  'Personais ilimitados (Starter: até 3)',
  'Relatórios avançados de engajamento',
  'Mapa de frequência detalhado',
  'Exportar dados em CSV',
  'Notificações para alunos inativos',
  'Personalização visual da academia',
  'Suporte prioritário',
]

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const BADGES = [
  { id: 'first',    icon: '🥉', label: 'Primeira pedrada', desc: '1 treino',          condition: (w: number, _s: number) => w >= 1   },
  { id: 'five',     icon: '🥈', label: 'Constante',         desc: '5 treinos',         condition: (w: number, _s: number) => w >= 5   },
  { id: 'ten',      icon: '🥇', label: 'Dedicado',           desc: '10 treinos',        condition: (w: number, _s: number) => w >= 10  },
  { id: 'thirty',   icon: '💎', label: 'Veterano',           desc: '30 treinos',        condition: (w: number, _s: number) => w >= 30  },
  { id: 'hundred',  icon: '👑', label: 'Lenda',               desc: '100 treinos',       condition: (w: number, _s: number) => w >= 100 },
  { id: 'streak3',  icon: '🔥', label: 'Em chamas',           desc: '3 dias seguidos',   condition: (_w: number, s: number) => s >= 3   },
  { id: 'streak7',  icon: '⚡', label: 'Inabalável',          desc: '7 dias seguidos',   condition: (_w: number, s: number) => s >= 7   },
  { id: 'streak14', icon: '🏆', label: 'Imparável',           desc: '14 dias seguidos',  condition: (_w: number, s: number) => s >= 14  },
  { id: 'streak30', icon: '💫', label: 'Fenômeno',             desc: '30 dias seguidos',  condition: (_w: number, s: number) => s >= 30  },
]

const FREE_CATEGORIES = [
  { id: 'musculacao', label: 'Musculação', emoji: '💪' },
  { id: 'cardio',     label: 'Cardio',     emoji: '🏃' },
  { id: 'funcional',  label: 'Funcional',  emoji: '⚡' },
  { id: 'yoga',       label: 'Yoga',       emoji: '🧘' },
  { id: 'esportes',   label: 'Esportes',   emoji: '⚽' },
  { id: 'outro',      label: 'Outro',      emoji: '🎯' },
]

const FREE_DURATIONS = [
  { label: '30min', value: 30 },
  { label: '45min', value: 45 },
  { label: '1h',    value: 60 },
  { label: '1h30',  value: 90 },
]

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { currentRole, profile, currentAcademy } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])
  const isOwner    = currentRole === 'owner'
  const isPersonal = currentRole === 'personal'
  const isStudent  = currentRole === 'student'
  // Personal trainer SOLO (owner com plan='personal') — esconde multi-personal UI.
  // Diferente de `isPersonal` acima, que é o role de sub-personal trabalhando pra owner.
  const isPersonalPlan = currentAcademy?.plan === 'personal'

  // Owner
  const [ownerMetrics, setOwnerMetrics] = useState<OwnerMetrics>({
    totalStudents: 0, activePersonals: 0, activeThisWeek: 0, inactiveCount: 0,
    workoutsThisWeek: 0, workoutsLastWeek: 0, newThisMonth: 0, studentsWithoutSheets: 0,
  })
  const [recentMembers,   setRecentMembers]   = useState<RecentMember[]>([])
  const [recentWorkouts,  setRecentWorkouts]  = useState<RecentWorkout[]>([])
  const [inactiveStudents,setInactiveStudents]= useState<InactiveStudent[]>([])
  const [personaisPerf,   setPersonaisPerf]   = useState<PersonalPerf[]>([])

  // Personal
  const [personalMetrics,        setPersonalMetrics]        = useState<PersonalMetrics>({ myStudentsCount: 0, trainedTodayCount: 0, activeSheetsCount: 0, inactiveCount: 0 })
  const [myStudents,             setMyStudents]             = useState<MyStudent[]>([])
  const [personalRecentWorkouts, setPersonalRecentWorkouts] = useState<RecentWorkout[]>([])

  const [accountType, setAccountType] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  async function handleOwnerPlanChange(planId: 'starter' | 'pro') {
    setUpgrading(planId)
    try {
      const res = await fetch('/api/academy/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch {
      toast.error('Erro ao iniciar pagamento. Tente novamente.')
      setUpgrading(null)
    }
  }

async function logFreeWorkout() {
    if (!freeCategory || !currentAcademy) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setFreeLogging(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('workout_logs').insert({
        student_id: user.id,
        academy_id: currentAcademy.id,
        workout_type: freeCategory,
        duration_seconds: freeDuration ? freeDuration * 60 : null,
        completed_at: new Date().toISOString(),
      })
      if (error) throw error
      toast.success('Treino registrado! 💪')
      setFreeLoggedToday(true)
      setFreeCategory(null)
      setFreeDuration(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loadStudentData(supabase as any, currentAcademy.id)
    } catch {
      toast.error('Erro ao registrar treino.')
    } finally {
      setFreeLogging(false)
    }
  }

  // Student
  const [studentStats, setStudentStats] = useState<StudentStats>({ totalWorkouts: 0, weekWorkouts: 0, streak: 0, activeSheets: 0, weekGoal: 3 })
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null)
  const [nextWorkout,  setNextWorkout]  = useState<NextWorkout | null>(null)
  const [lastWorkout,  setLastWorkout]  = useState<LastWorkoutSummary | null>(null)
  const [monthlyWorkouts, setMonthlyWorkouts] = useState<MonthlyWorkout[]>([])
  const [freeCategory,    setFreeCategory]    = useState<string | null>(null)
  const [freeDuration,    setFreeDuration]    = useState<number | null>(null)
  const [freeLogging,     setFreeLogging]     = useState(false)
  const [freeLoggedToday, setFreeLoggedToday] = useState(false)
  const [weekActivity,    setWeekActivity]    = useState<boolean[]>(Array(7).fill(false))
  const [dataLoaded,      setDataLoaded]      = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAccountType(user?.user_metadata?.['account_type'] ?? 'owner')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Owner/personal sem academia jamais deveria parar no dashboard — manda pro onboarding.
  // Sem isso o usuário fica preso numa tela vazia depois de signup incompleto ou após
  // cancelar checkout do Stripe.
  useEffect(() => {
    if (accountType && !currentRole && (accountType === 'owner' || accountType === 'personal')) {
      router.replace('/onboarding')
    }
  }, [accountType, currentRole, router])

  useEffect(() => {
    if (!currentAcademy) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const aid = currentAcademy.id
    setDataLoaded(false)
    if (isOwner)    loadOwnerData(sb, aid).finally(() => setDataLoaded(true))
    if (isPersonal) loadPersonalData(sb, aid).finally(() => setDataLoaded(true))
    if (isStudent)  loadStudentData(sb, aid).finally(() => setDataLoaded(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademy, currentRole])

  // ── Owner data ──────────────────────────────────────────────
  // 1 roundtrip via RPC get_owner_dashboard (migration 056).
  // Substitui as ~14 queries que existiam aqui antes — ver
  // CLAUDE.md → "Otimização do dashboard".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function loadOwnerData(sb: any, aid: string) {
    const now = new Date()
    const weekAgo     = new Date(now); weekAgo.setDate(now.getDate() - 7)
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)
    const monthAgo    = new Date(now); monthAgo.setDate(now.getDate() - 30)

    const { data, error } = await sb.rpc('get_owner_dashboard', {
      p_academy_id:    aid,
      p_week_ago:      weekAgo.toISOString(),
      p_two_weeks_ago: twoWeeksAgo.toISOString(),
      p_month_ago:     monthAgo.toISOString(),
    })

    if (error || !data) {
      console.error('get_owner_dashboard failed', error)
      return
    }

    const d = data as {
      total_students: number
      active_personals: number
      workouts_this_week: number
      workouts_last_week: number
      new_this_month: number
      active_this_week: number
      inactive_count: number
      students_without_sheets: number
      recent_students: Array<{ id: string; user_id: string; joined_at: string; full_name: string | null }>
      recent_workouts: Array<{ id: string; created_at: string; student_id: string; sheet_id: string | null; duration_seconds: number | null; student_name: string | null; sheet_name: string | null }>
      inactive_students: Array<{ user_id: string; full_name: string | null; last_workout_at: string | null }>
      personais_perf: Array<{ user_id: string; full_name: string | null; student_count: number }>
    }

    setOwnerMetrics({
      totalStudents:         d.total_students,
      activePersonals:       d.active_personals,
      activeThisWeek:        d.active_this_week,
      inactiveCount:         d.inactive_count,
      workoutsThisWeek:      d.workouts_this_week,
      workoutsLastWeek:      d.workouts_last_week,
      newThisMonth:          d.new_this_month,
      studentsWithoutSheets: d.students_without_sheets,
    })

    setRecentMembers(d.recent_students.map((m) => ({
      id: m.id, userId: m.user_id, joinedAt: m.joined_at,
      fullName: m.full_name ?? 'Usuário',
    })))

    setRecentWorkouts(d.recent_workouts.map((w) => ({
      id: w.id, createdAt: w.created_at,
      studentName: w.student_name ?? 'Aluno',
      sheetName:   w.sheet_name   ?? 'Treino',
      durationSeconds: w.duration_seconds,
    })))

    setPersonaisPerf(d.personais_perf.map((p) => ({
      userId:       p.user_id,
      fullName:     p.full_name ?? 'Personal',
      studentCount: p.student_count,
    })))

    setInactiveStudents(d.inactive_students.map((i) => ({
      userId:        i.user_id,
      fullName:      i.full_name ?? 'Aluno',
      lastWorkoutAt: i.last_workout_at,
    })))
  }

  // ── Personal data ───────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function loadPersonalData(sb: any, aid: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const weekAgo    = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

    // "Meus alunos" do personal = alunos que ELE convidou (academy_members.invited_by,
    // gravado pelo accept_invite). Não depende de fichas criadas — um personal novo
    // que convida um aluno já o vê aqui, e não vê alunos de outros personais.
    const { data: studentMembers } = await sb
      .from('academy_members')
      .select('user_id')
      .eq('academy_id', aid).eq('role', 'student').eq('is_active', true)
      .eq('invited_by', user.id)
    const myStudentIds = [...new Set((studentMembers ?? []).map((m: { user_id: string }) => m.user_id))] as string[]

    if (myStudentIds.length === 0) {
      setPersonalMetrics({ myStudentsCount: 0, trainedTodayCount: 0, activeSheetsCount: 0, inactiveCount: 0 })
      return
    }

    // Alunos com alguma ficha ativa (de qualquer personal).
    const { data: activeSheetRows } = await sb
      .from('workout_sheets')
      .select('student_id')
      .eq('academy_id', aid).eq('is_active', true).in('student_id', myStudentIds)
    const activeSheetStudents = new Set((activeSheetRows ?? []).map((s: { student_id: string }) => s.student_id))

    const [{ data: recentLogs }, { data: todayLogs }, { data: profiles }, { data: myRecentRaw }, { data: mySheetNames }] = await Promise.all([
      sb.from('workout_logs').select('student_id, created_at').eq('academy_id', aid).in('student_id', myStudentIds).gte('created_at', weekAgo.toISOString()),
      sb.from('workout_logs').select('student_id').eq('academy_id', aid).in('student_id', myStudentIds).gte('created_at', todayStart.toISOString()),
      sb.from('profiles').select('id, full_name').in('id', myStudentIds),
      sb.from('workout_logs').select('id, created_at, student_id, duration_seconds, sheet_id').eq('academy_id', aid).in('student_id', myStudentIds).order('created_at', { ascending: false }).limit(8),
      sb.from('workout_sheets').select('id, name').eq('academy_id', aid).in('student_id', myStudentIds),
    ])

    type ProfileRow   = { id: string; full_name: string }
    type SheetNameRow = { id: string; name: string }
    const profileMap  = new Map((profiles ?? []).map((p: ProfileRow) => [p.id, p.full_name]))
    const sheetNameMap= new Map((mySheetNames ?? []).map((s: SheetNameRow) => [s.id, s.name]))
    const recentSet   = new Set((recentLogs ?? []).map((l: { student_id: string }) => l.student_id))
    const todaySet    = new Set((todayLogs ?? []).map((l: { student_id: string }) => l.student_id))

    const lastMap = new Map<string, string>()
    for (const log of (recentLogs ?? [])) { if (!lastMap.has(log.student_id)) lastMap.set(log.student_id, log.created_at) }

    setPersonalMetrics({
      myStudentsCount: myStudentIds.length,
      trainedTodayCount: todaySet.size,
      activeSheetsCount: activeSheetStudents.size,
      inactiveCount: myStudentIds.filter(id => !recentSet.has(id)).length,
    })

    setMyStudents(myStudentIds.map(id => ({
      userId: id,
      fullName: (profileMap.get(id) as string | undefined) ?? 'Aluno',
      lastWorkoutAt: lastMap.get(id) ?? null,
      activeSheets: activeSheetStudents.has(id) ? 1 : 0,
      trainedToday: todaySet.has(id),
    })).sort((a, b) => (b.trainedToday ? 1 : 0) - (a.trainedToday ? 1 : 0)))

    setPersonalRecentWorkouts((myRecentRaw ?? []).map((w: { id: string; created_at: string; student_id: string; sheet_id: string; duration_seconds: number | null }) => ({
      id: w.id, createdAt: w.created_at,
      studentName: (profileMap.get(w.student_id) as string | undefined) ?? 'Aluno',
      sheetName: (sheetNameMap.get(w.sheet_id) as string | undefined) ?? 'Treino',
      durationSeconds: w.duration_seconds,
    })))
  }

  // ── Student data ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function loadStudentData(sb: any, aid: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const weekAgo    = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const todayIndex = new Date().getDay()
    const todayStr   = dateKey(new Date())
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

    const [{ count: total }, { count: week }, { count: sheets }, { data: logDates }, { data: lastLogRaw }, { count: freeTodayCount }] = await Promise.all([
      sb.from('workout_logs').select('id', { count: 'exact', head: true }).eq('student_id', user.id).eq('academy_id', aid),
      sb.from('workout_logs').select('id', { count: 'exact', head: true }).eq('student_id', user.id).eq('academy_id', aid).gte('created_at', weekAgo.toISOString()),
      sb.from('workout_sheets').select('id', { count: 'exact', head: true }).eq('student_id', user.id).eq('academy_id', aid).eq('is_active', true),
      sb.from('workout_logs').select('created_at').eq('student_id', user.id).eq('academy_id', aid),
      sb.from('workout_logs').select('id, created_at, duration_seconds, sheet_id').eq('student_id', user.id).eq('academy_id', aid).order('created_at', { ascending: false }).limit(1),
      sb.from('workout_logs').select('id', { count: 'exact', head: true }).eq('student_id', user.id).eq('academy_id', aid).is('sheet_id', null).gte('created_at', todayStart.toISOString()),
    ])

    const streak = computeStreak((logDates ?? []).map((r: { created_at: string }) => r.created_at))
    setStudentStats({ totalWorkouts: total ?? 0, weekWorkouts: week ?? 0, streak, activeSheets: sheets ?? 0, weekGoal: 3 })
    setFreeLoggedToday((freeTodayCount ?? 0) > 0)

    const daySet = new Set((logDates ?? []).map((r: { created_at: string }) => dateKey(new Date(r.created_at))))
    setWeekActivity(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      return daySet.has(dateKey(d))
    }))

    const months: MonthlyWorkout[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const count = (logDates ?? []).filter((r: { created_at: string }) => r.created_at.startsWith(key)).length
      months.push({ month: label, count })
    }
    setMonthlyWorkouts(months)

    // Last workout
    if (lastLogRaw?.[0]) {
      const last = lastLogRaw[0]
      const { data: sheetData } = await sb.from('workout_sheets').select('name').eq('id', last.sheet_id).maybeSingle()
      setLastWorkout({ sheetName: sheetData?.name ?? 'Treino', durationSeconds: last.duration_seconds, createdAt: last.created_at })
    }

    // Today's workout
    const { data: todaySheet } = await sb.from('workout_sheets')
      .select('id, name, goal, scheduled_days, sheet_exercises(id)')
      .eq('student_id', user.id).eq('academy_id', aid).eq('is_active', true)
      .contains('scheduled_days', [todayIndex]).limit(1).maybeSingle()

    let hasTodayWorkout = false
    if (todaySheet) {
      const { data: completion } = await sb.from('agenda_completions').select('id')
        .eq('sheet_id', todaySheet.id).eq('student_id', user.id).eq('completed_on', todayStr).maybeSingle()
      setTodayWorkout({ id: todaySheet.id, name: todaySheet.name, goal: todaySheet.goal, exerciseCount: todaySheet.sheet_exercises?.length ?? 0, alreadyDone: !!completion })
      hasTodayWorkout = true
    }

    // Next workout (find next scheduled day if nothing today)
    if (!hasTodayWorkout) {
      const { data: allSheets } = await sb.from('workout_sheets')
        .select('id, name, goal, scheduled_days, sheet_exercises(id)')
        .eq('student_id', user.id).eq('academy_id', aid).eq('is_active', true)
      const sheetByDay = new Map<number, { id: string; name: string; goal: string | null; sheet_exercises: { id: string }[] }>()
      for (const s of (allSheets ?? [])) {
        for (const day of (s.scheduled_days ?? [])) {
          if (!sheetByDay.has(day)) sheetByDay.set(day, s)
        }
      }
      for (let i = 1; i <= 7; i++) {
        const nextDay = (todayIndex + i) % 7
        if (sheetByDay.has(nextDay)) {
          const s = sheetByDay.get(nextDay)!
          setNextWorkout({ id: s.id, name: s.name, goal: s.goal, exerciseCount: s.sheet_exercises?.length ?? 0, dayLabel: DAY_LABELS[nextDay] ?? '' })
          break
        }
      }
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const hasAcademy      = !!currentAcademy
  const engagementPct   = ownerMetrics.totalStudents > 0 ? Math.round((ownerMetrics.activeThisWeek / ownerMetrics.totalStudents) * 100) : 0
  const workoutsDelta   = ownerMetrics.workoutsLastWeek > 0
    ? `${ownerMetrics.workoutsThisWeek >= ownerMetrics.workoutsLastWeek ? '+' : ''}${Math.round(((ownerMetrics.workoutsThisWeek - ownerMetrics.workoutsLastWeek) / ownerMetrics.workoutsLastWeek) * 100)}%`
    : undefined
  const trainedToday    = weekActivity[6] === true || freeLoggedToday || (todayWorkout?.alreadyDone ?? false)
  const streakAtRisk    = studentStats.streak > 0 && !trainedToday

  return (
    // Em dev, força reducedMotion pra desligar transições do framer-motion. Em prod,
    // respeita prefers-reduced-motion do usuário. Tira ~30-50% de overhead de render
    // em dashboards com muitos motion.div animados em paralelo.
    <MotionConfig reducedMotion={process.env.NODE_ENV === 'development' ? 'always' : 'user'}>
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Welcome */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-display font-bold">
            {greeting()}, {profile?.full_name?.split(' ')[0] ?? 'usuário'} 👋
          </h2>
{isOwner && currentAcademy?.plan && OWNER_PLAN_INFO[currentAcademy.plan] && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: `${OWNER_PLAN_INFO[currentAcademy.plan]!.color}18`, color: OWNER_PLAN_INFO[currentAcademy.plan]!.color, border: `1px solid ${OWNER_PLAN_INFO[currentAcademy.plan]!.color}30` }}>
              {OWNER_PLAN_INFO[currentAcademy.plan]!.emoji} Plano {OWNER_PLAN_INFO[currentAcademy.plan]!.name}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </motion.div>

      {/* ════════════════════════════════════════
          OWNER
      ════════════════════════════════════════ */}
      {/* Loading skeletons */}
      {!dataLoaded && hasAcademy && (
        <motion.div variants={fadeUp} className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 border border-border/40 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-56 w-full rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          </div>
        </motion.div>
      )}

      {isOwner && !hasAcademy && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-6 border border-brand-500/20 bg-brand-500/5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold">Configure sua academia</p>
              <p className="text-sm text-muted-foreground mt-1">Crie sua academia para convidar alunos e gerenciar treinos.</p>
              <Link href="/onboarding?type=owner" className="btn-primary text-xs py-2 px-4 rounded-xl mt-3 inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Criar academia
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {isOwner && hasAcademy && dataLoaded && (
        <>
          {/* KPIs — 4 cards */}
          <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total de alunos"     value={ownerMetrics.totalStudents}    delta={ownerMetrics.newThisMonth > 0 ? `+${ownerMetrics.newThisMonth}` : undefined} icon={Users}       color="#6366F1" empty={ownerMetrics.totalStudents === 0} />
            <StatCard label="Novos este mês"      value={ownerMetrics.newThisMonth}                                                                                         icon={UserPlus}    color="#10B981" empty={ownerMetrics.newThisMonth === 0} />
            {!isPersonalPlan ? (
              <StatCard label="Personais ativos"    value={ownerMetrics.activePersonals}                                                                                      icon={ShieldCheck} color="#8B5CF6" empty={ownerMetrics.activePersonals === 0} />
            ) : (
              <StatCard label="Sem ficha"           value={ownerMetrics.studentsWithoutSheets}                                                                                icon={ClipboardList} color="#8B5CF6" empty={ownerMetrics.studentsWithoutSheets === 0} />
            )}
            <StatCard label="Engajamento"         value={engagementPct} suffix="%"                                                                                          icon={Activity}    color="#06B6D4" empty={ownerMetrics.totalStudents === 0} />
            <StatCard label="Treinos esta semana" value={ownerMetrics.workoutsThisWeek} delta={workoutsDelta}                                                               icon={Dumbbell}    color="#F59E0B" empty={ownerMetrics.totalStudents === 0} />
            <StatCard label="Ativos esta semana"  value={ownerMetrics.activeThisWeek}                                                                                       icon={Flame}       color="#F97316" empty={ownerMetrics.totalStudents === 0} />
          </motion.div>

          {/* Alertas */}
          {(ownerMetrics.inactiveCount > 0 || ownerMetrics.studentsWithoutSheets > 0) && (
            <motion.div variants={fadeUp} className="space-y-2">
              {ownerMetrics.inactiveCount > 0 && (
                <AlertBanner icon={AlertTriangle} color="#F59E0B">
                  <span className="font-bold text-amber-300">{ownerMetrics.inactiveCount} aluno{ownerMetrics.inactiveCount > 1 ? 's' : ''}</span>{' '}
                  não treinaram esta semana.{' '}
                  <Link href="/alunos" className="underline text-amber-400">Ver detalhes →</Link>
                </AlertBanner>
              )}
              {ownerMetrics.studentsWithoutSheets > 0 && (
                <AlertBanner icon={ClipboardList} color="#06B6D4">
                  <span className="font-bold text-cyan-300">{ownerMetrics.studentsWithoutSheets} aluno{ownerMetrics.studentsWithoutSheets > 1 ? 's' : ''}</span>{' '}
                  ainda {ownerMetrics.studentsWithoutSheets > 1 ? 'não têm' : 'não tem'} ficha de treino.{' '}
                  <Link href="/alunos" className="underline text-cyan-400">Atribuir fichas →</Link>
                </AlertBanner>
              )}
            </motion.div>
          )}

          {/* Main 2/3 + 1/3 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left col — financeiro + crescimento */}
            <motion.div variants={fadeUp} className="xl:col-span-2 space-y-4">

              {/* Plano / financeiro */}
              {currentAcademy?.plan && OWNER_PLAN_INFO[currentAcademy.plan] && (() => {
                const p = OWNER_PLAN_INFO[currentAcademy.plan!]!
                const isStarter = currentAcademy.plan === 'starter'
                const isPersonalCardPlan = currentAcademy.plan === 'personal'
                const studentUsagePct = isStarter ? Math.min((ownerMetrics.totalStudents / 50) * 100, 100) : 0
                const personalUsagePct = isStarter ? Math.min((ownerMetrics.activePersonals / 3) * 100, 100) : 0
                return (
                  <div className="glass rounded-2xl p-5" style={{ border: `1px solid ${p.color}20` }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-display font-bold">Plano atual</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Cobrança mensal recorrente</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-display font-extrabold" style={{ color: p.color }}>{p.price}</p>
                        {p.trial && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">30 dias grátis</span>}
                      </div>
                    </div>

                    {isStarter && (
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Alunos</span>
                            <span className="text-xs font-semibold">{ownerMetrics.totalStudents} <span className="text-muted-foreground">/ 50</span></span>
                          </div>
                          <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${studentUsagePct}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                              className={cn('h-full rounded-full', studentUsagePct >= 90 ? 'bg-red-500' : studentUsagePct >= 70 ? 'bg-amber-500' : 'bg-emerald-500')} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Personais</span>
                            <span className="text-xs font-semibold">{ownerMetrics.activePersonals} <span className="text-muted-foreground">/ 3</span></span>
                          </div>
                          <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${personalUsagePct}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                              className={cn('h-full rounded-full', personalUsagePct >= 90 ? 'bg-red-500' : 'bg-indigo-500')} />
                          </div>
                        </div>
                      </div>
                    )}

                    {isStarter && (
                      <>
                        <div className="rounded-xl p-3 mb-3" style={{ background: `${OWNER_PLAN_INFO['pro']!.color}0A`, border: `1px solid ${OWNER_PLAN_INFO['pro']!.color}20` }}>
                          <p className="text-[11px] font-bold mb-1.5" style={{ color: OWNER_PLAN_INFO['pro']!.color }}>👑 Pro desbloqueia:</p>
                          <ul className="grid grid-cols-2 gap-1">
                            {PRO_UPGRADE_FEATURES.slice(0, 4).map(f => (
                              <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Check className="w-2.5 h-2.5 flex-shrink-0" style={{ color: OWNER_PLAN_INFO['pro']!.color }} />{f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button onClick={() => handleOwnerPlanChange('pro')} disabled={!!upgrading}
                          className="w-full text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                          style={{ background: `${OWNER_PLAN_INFO['pro']!.color}15`, color: OWNER_PLAN_INFO['pro']!.color, border: `1px solid ${OWNER_PLAN_INFO['pro']!.color}25` }}>
                          {upgrading === 'pro' ? <Loader2 className="w-3 h-3 animate-spin" /> : <>👑 Fazer upgrade para Pro — R$ 397/mês</>}
                        </button>
                      </>
                    )}
                    {currentAcademy.plan === 'pro' && (
                      <p className="text-[11px] text-center text-emerald-400 font-semibold">Você está no plano máximo 🎉</p>
                    )}
                    {isPersonalCardPlan && (
                      <>
                        <div className="rounded-xl p-3 mb-2" style={{ background: `${p.color}0A`, border: `1px solid ${p.color}20` }}>
                          <p className="text-[11px] font-bold mb-1.5" style={{ color: p.color }}>{p.emoji} Inclui:</p>
                          <ul className="grid grid-cols-1 gap-1">
                            {p.features.map(f => (
                              <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Check className="w-2.5 h-2.5 flex-shrink-0" style={{ color: p.color }} />{f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-[11px] text-center text-muted-foreground">Solo personal trainer — alunos ilimitados</p>
                      </>
                    )}
                  </div>
                )
              })()}

              {/* Crescimento de alunos */}
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold">Crescimento de alunos</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Últimos 30 dias</p>
                  </div>
                  <Link href="/alunos" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></Link>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-surface-100">
                    <p className="text-2xl font-display font-extrabold text-indigo-400">{ownerMetrics.totalStudents}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <p className="text-2xl font-display font-extrabold text-emerald-400">+{ownerMetrics.newThisMonth}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Novos</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-surface-100">
                    <p className="text-2xl font-display font-extrabold text-cyan-400">{engagementPct}%</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Engajados</p>
                  </div>
                </div>

                {recentMembers.length === 0 ? (
                  <EmptyState icon={Users} title="Nenhum aluno ainda" description="Convide seus primeiros alunos." cta="Convidar" ctaHref="/alunos" />
                ) : (
                  <div className="space-y-2">
                    {recentMembers.map(m => (
                      <Link key={m.id} href={`/alunos/${m.userId}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-indigo-400">{m.fullName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{m.fullName}</p>
                          <p className="text-[10px] text-muted-foreground">Entrou {formatTimeAgo(m.joinedAt)}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Treinos recentes */}
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold">Treinos recentes</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Atividade da academia</p>
                  </div>
                </div>
                {recentWorkouts.length === 0 ? (
                  <EmptyState icon={Dumbbell} title="Nenhum treino registrado" description="Os treinos dos alunos aparecerão aqui quando forem executados." cta="Ver alunos" ctaHref="/alunos" />
                ) : (
                  <div className="space-y-2">
                    {recentWorkouts.map(w => (
                      <div key={w.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-100">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                          <Dumbbell className="w-3.5 h-3.5 text-brand-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{w.studentName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{w.sheetName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-muted-foreground">{formatTimeAgo(w.createdAt)}</p>
                          {w.durationSeconds != null && (
                            <p className="text-[10px] text-brand-400 flex items-center gap-0.5 justify-end">
                              <Clock className="w-2.5 h-2.5" />{formatDuration(w.durationSeconds)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right col */}
            <motion.div variants={fadeUp} className="space-y-4">
              {/* Ações rápidas */}
              <div className="glass rounded-2xl p-4">
                <h3 className="font-display font-bold text-sm mb-3">Ações rápidas</h3>
                <QuickAction icon={UserPlus}    label="Convidar aluno"          href="/alunos"        color="#06B6D4" />
                {!isPersonalPlan && (
                  <QuickAction icon={ShieldCheck} label="Convidar personal"      href="/personais"    color="#8B5CF6" />
                )}
                <QuickAction icon={Dumbbell}    label="Fichas de treino"       sublabel="Ver e gerenciar fichas" href="/treinos"      color="#10B981" />
                <QuickAction icon={BarChart3}   label="Relatórios"             sublabel="Engajamento geral"      href="/relatorios"   color="#F97316" />
                <QuickAction icon={Settings}    label="Configurações"          href="/configuracoes" color="#6366F1" />
              </div>

              {/* Personais — só faz sentido pra owners de academia, não pra personal solo */}
              {!isPersonalPlan && (
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm">Personais</h3>
                  <Link href="/personais" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">Gerenciar <ChevronRight className="w-3 h-3" /></Link>
                </div>
                {personaisPerf.length === 0 ? (
                  <EmptyState icon={ShieldCheck} title="Nenhum personal" description="Convide personal trainers para sua academia." cta="Convidar" ctaHref="/personais" />
                ) : (
                  <div className="space-y-2">
                    {personaisPerf.map(p => (
                      <div key={p.userId} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-100">
                        <div className="w-7 h-7 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-purple-400">{p.fullName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{p.fullName}</p>
                          <p className="text-[10px] text-muted-foreground">{p.studentCount} aluno{p.studentCount !== 1 ? 's' : ''}</p>
                        </div>
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
                          p.studentCount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-surface-200 text-muted-foreground')}>
                          {p.studentCount > 0 ? 'Ativo' : 'Sem alunos'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* Alunos inativos */}
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm">Alunos inativos</h3>
                  <Link href="/alunos" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></Link>
                </div>
                {inactiveStudents.length === 0 ? (
                  <div className="py-3 text-center">
                    <p className="text-[11px] text-emerald-400 font-semibold">✓ Todos treinaram esta semana!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inactiveStudents.slice(0, 5).map(s => (
                      <Link key={s.userId} href={`/alunos/${s.userId}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-amber-400">{s.fullName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{s.fullName}</p>
                          <p className="text-[10px] text-muted-foreground">{s.lastWorkoutAt ? `Último: ${formatTimeAgo(s.lastWorkoutAt)}` : 'Nunca treinou'}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          PERSONAL
      ════════════════════════════════════════ */}
      {isPersonal && dataLoaded && (
        <>
          {/* KPIs */}
          <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Meus alunos"     value={personalMetrics.myStudentsCount}    icon={Users}          color="#6366F1" empty={personalMetrics.myStudentsCount === 0} />
            <StatCard label="Treinaram hoje"  value={personalMetrics.trainedTodayCount}  icon={CalendarCheck}  color="#10B981" empty={personalMetrics.trainedTodayCount === 0} />
            <StatCard label="Com ficha ativa" value={personalMetrics.activeSheetsCount}  icon={ClipboardList}  color="#06B6D4" empty={personalMetrics.activeSheetsCount === 0} />
            <StatCard label="Inativos"        value={personalMetrics.inactiveCount}       icon={AlertTriangle}  color={personalMetrics.inactiveCount > 0 ? '#F59E0B' : '#10B981'} warning={personalMetrics.inactiveCount > 0} empty={personalMetrics.myStudentsCount === 0} />
          </motion.div>

          {/* Alert */}
          {personalMetrics.inactiveCount > 0 && (
            <motion.div variants={fadeUp}>
              <AlertBanner icon={AlertTriangle} color="#F59E0B">
                <span className="font-bold text-amber-300">{personalMetrics.inactiveCount} aluno{personalMetrics.inactiveCount > 1 ? 's' : ''}</span> não treinaram esta semana.{' '}
                <Link href="/alunos" className="underline text-amber-400">Ver detalhes →</Link>
              </AlertBanner>
            </motion.div>
          )}

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* My students + Bio do personal vinculado */}
            <motion.div variants={fadeUp} className="xl:col-span-2 space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold">Meus alunos</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Status de hoje</p>
                </div>
                <Link href="/alunos" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">Ver todos <ChevronRight className="w-3 h-3" /></Link>
              </div>
              {myStudents.length === 0 ? (
                <EmptyState icon={Users} title="Nenhum aluno ainda" description="Crie fichas de treino para seus alunos." cta="Nova ficha" ctaHref="/treinos/novo" />
              ) : (
                <div className="space-y-2">
                  {myStudents.map(s => (
                    <Link key={s.userId} href={`/alunos/${s.userId}`} className="flex items-center gap-3 p-3 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors">
                      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', s.trainedToday ? 'bg-emerald-500/15' : 'bg-surface-200')}>
                        <span className={cn('text-sm font-bold', s.trainedToday ? 'text-emerald-400' : 'text-muted-foreground')}>
                          {s.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.trainedToday ? '✅ Treinou hoje' : s.lastWorkoutAt ? `Último: ${formatTimeAgo(s.lastWorkoutAt)}` : 'Nunca treinou'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                          s.activeSheets > 0 ? 'bg-brand-500/10 text-brand-400' : 'bg-amber-500/10 text-amber-400')}>
                          {s.activeSheets > 0 ? 'Com ficha' : 'Sem ficha'}
                        </span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            </motion.div>

            {/* Right col */}
            <motion.div variants={fadeUp} className="space-y-4">
              {/* Recent workouts */}
              <div className="glass rounded-2xl p-5">
                <h3 className="font-display font-bold text-sm mb-3">Treinos recentes</h3>
                {personalRecentWorkouts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum treino ainda</p>
                ) : (
                  <div className="space-y-2">
                    {personalRecentWorkouts.slice(0, 5).map(w => (
                      <div key={w.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-100">
                        <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                          <Dumbbell className="w-3 h-3 text-brand-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{w.studentName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{w.sheetName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-muted-foreground">{formatTimeAgo(w.createdAt)}</p>
                          {w.durationSeconds != null && (
                            <p className="text-[10px] text-brand-400 flex items-center gap-0.5 justify-end">
                              <Clock className="w-2.5 h-2.5" />{formatDuration(w.durationSeconds)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="glass rounded-2xl p-4">
                <h3 className="font-display font-bold text-sm mb-3">Ações rápidas</h3>
                <QuickAction icon={Dumbbell}     label="Nova ficha"       sublabel="Criar para um aluno" href="/treinos/novo" color="#6366F1" />
                <QuickAction icon={Users}        label="Meus alunos"      href="/alunos"      color="#06B6D4" />
                <QuickAction icon={BookOpen}     label="Exercícios"       href="/exercicios"  color="#10B981" />
                <QuickAction icon={BarChart3}    label="Ver frequência"   href="/frequencia"  color="#F59E0B" />
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          STUDENT
      ════════════════════════════════════════ */}
      {isStudent && dataLoaded && (
        <>
          {/* KPIs */}
          <motion.div variants={stagger} className="grid grid-cols-3 gap-3">
            <StatCard label="Treinos totais" value={studentStats.totalWorkouts} icon={Dumbbell}      color="#6366F1" empty={studentStats.totalWorkouts === 0} />
            <StatCard label="Esta semana"    value={studentStats.weekWorkouts}  icon={Calendar}      color="#10B981" empty={studentStats.weekWorkouts === 0} />
            <StatCard label="Fichas ativas"  value={studentStats.activeSheets}  icon={ClipboardList} color="#F59E0B" empty={studentStats.activeSheets === 0} />
          </motion.div>

          {/* Ofensiva — Duolingo-style */}
          {(() => {
            const streakColor  = streakAtRisk ? '#F59E0B' : studentStats.streak > 0 ? '#F97316' : '#6366F1'
            const streakMsg    = studentStats.streak === 0    ? 'Complete um treino para começar a sua ofensiva!'
                               : studentStats.streak < 3     ? 'Ótima largada! Treine amanhã também.'
                               : studentStats.streak < 7     ? 'Está pegando fogo! Não pare agora.'
                               : studentStats.streak < 14    ? 'Uma semana de dedicação pura!'
                               : studentStats.streak < 30    ? 'Você é imparável. Continue assim.'
                               : studentStats.streak < 60    ? 'Um mês de consistência — lendário!'
                               : 'Status: fenômeno absoluto. 👑'
            const flameEmoji   = studentStats.streak === 0   ? '🌱'
                               : studentStats.streak < 7     ? '🔥'
                               : studentStats.streak < 30    ? '💥'
                               : '👑'
            return (
              <motion.div variants={fadeUp} className={cn(
                'glass rounded-2xl p-5 overflow-hidden relative',
                streakAtRisk && 'border-amber-500/25 bg-amber-500/5',
              )}>
                {/* Fundo decorativo */}
                <div className="pointer-events-none absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl opacity-10"
                  style={{ background: streakColor }} />

                {/* Topo: número + emoji */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-end gap-2.5">
                      <motion.span
                        key={studentStats.streak}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1,   opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="text-6xl font-display font-extrabold leading-none tabular-nums"
                        style={{ color: streakColor }}
                      >
                        {studentStats.streak}
                      </motion.span>
                      <div className="pb-1.5">
                        <p className="text-[11px] text-muted-foreground leading-tight">dias de</p>
                        <p className="text-sm font-bold leading-tight">ofensiva</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[220px]">{streakMsg}</p>
                  </div>
                  <motion.span
                    animate={trainedToday && studentStats.streak > 0
                      ? { rotate: [0, -8, 8, -8, 0], scale: [1, 1.15, 1] }
                      : {}}
                    transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 4 }}
                    className="text-5xl leading-none select-none flex-shrink-0"
                  >
                    {flameEmoji}
                  </motion.span>
                </div>

                {/* Grid de 7 dias */}
                <div className="flex gap-1.5">
                  {weekActivity.map((active, i) => {
                    const isToday = i === 6
                    const d = new Date(); d.setDate(d.getDate() - (6 - i))
                    const dayLabel = DAY_LABELS[d.getDay()]
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                        <p className={cn(
                          'text-[9px] font-semibold uppercase tracking-wide',
                          isToday ? 'text-foreground' : 'text-muted-foreground/50',
                        )}>
                          {dayLabel}
                        </p>
                        <div className={cn(
                          'w-full aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300',
                          active && isToday  && 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110',
                          active && !isToday && 'bg-orange-500/20 text-orange-400 border border-orange-500/25',
                          !active && isToday && streakAtRisk && 'border-2 border-dashed border-amber-400/60 text-amber-400/60',
                          !active && isToday && !streakAtRisk && 'border-2 border-dashed border-brand-500/40 text-brand-400/50',
                          !active && !isToday && 'bg-surface-100 text-muted-foreground/20',
                        )}>
                          {active ? '✓' : isToday ? '·' : '·'}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Banner: ofensiva em risco */}
                {streakAtRisk && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                  >
                    <span className="text-lg flex-shrink-0">⚠️</span>
                    <p className="text-xs text-amber-300 font-medium leading-snug">
                      Sua ofensiva de <span className="font-bold text-amber-200">{studentStats.streak} dia{studentStats.streak !== 1 ? 's' : ''}</span> está em risco! Treine hoje para não perder.
                    </p>
                  </motion.div>
                )}

                {/* Banner: treinou hoje */}
                {trainedToday && studentStats.streak > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <span className="text-lg flex-shrink-0">🎉</span>
                    <p className="text-xs text-emerald-300 font-medium">
                      Ofensiva garantida hoje! Amanhã você chega a <span className="font-bold text-emerald-200">{studentStats.streak + 1} dias</span>.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )
          })()}

          {/* Meta semanal */}
          <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display font-bold text-sm">Meta semanal</h3>
                <p className="text-xs text-muted-foreground">{studentStats.weekWorkouts} de {studentStats.weekGoal} treinos esta semana</p>
              </div>
              <span className={cn('text-sm font-display font-extrabold',
                studentStats.weekWorkouts >= studentStats.weekGoal ? 'text-emerald-400' : 'text-brand-400')}>
                {Math.min(100, Math.round((studentStats.weekWorkouts / studentStats.weekGoal) * 100))}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-200 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (studentStats.weekWorkouts / studentStats.weekGoal) * 100)}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={cn('h-full rounded-full', studentStats.weekWorkouts >= studentStats.weekGoal ? 'bg-emerald-500' : 'bg-brand-500')}
              />
            </div>
            <div className="flex gap-2 mt-3">
              {Array.from({ length: studentStats.weekGoal }).map((_, i) => (
                <div key={i} className={cn('flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all',
                  i < studentStats.weekWorkouts ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-surface-200 text-muted-foreground/40')}>
                  {i < studentStats.weekWorkouts ? '✓' : i + 1}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Treino de hoje */}
          {todayWorkout && (
            <motion.div variants={fadeUp} className={cn('glass rounded-2xl p-5 border',
              todayWorkout.alreadyDone ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-brand-500/20 bg-brand-500/5')}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                    todayWorkout.alreadyDone ? 'bg-emerald-500/15' : 'bg-brand-500/15')}>
                    {todayWorkout.alreadyDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Dumbbell className="w-5 h-5 text-brand-400" />}
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
                  <Link href={`/treinos/executar/${todayWorkout.id}`} className="flex-shrink-0 flex items-center gap-1.5 btn-primary text-xs py-2.5 px-4 rounded-xl">
                    <Play className="w-3.5 h-3.5" /> Iniciar
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {/* Treino livre */}
          <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">Treino livre</h3>
                  <p className="text-xs text-muted-foreground">Por conta própria, sem ficha</p>
                </div>
              </div>
              {freeLoggedToday && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                  ✓ Registrado hoje
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-1">
              {FREE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFreeCategory(freeCategory === cat.id ? null : cat.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all',
                    freeCategory === cat.id
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-surface-100 text-muted-foreground hover:bg-surface-200',
                  )}
                >
                  <span className="text-base leading-none">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {freeCategory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-3 pt-3"
                >
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Duração (opcional)</p>
                    <div className="flex gap-2">
                      {FREE_DURATIONS.map(d => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setFreeDuration(freeDuration === d.value ? null : d.value)}
                          className={cn(
                            'flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                            freeDuration === d.value
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-surface-100 text-muted-foreground hover:bg-surface-200',
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={logFreeWorkout}
                    disabled={freeLogging}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/25"
                  >
                    {freeLogging
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><CheckCircle2 className="w-4 h-4" /> Registrar treino</>
                    }
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Próximo treino */}
          {!todayWorkout && nextWorkout && (
            <motion.div variants={fadeUp} className="glass rounded-2xl p-5 border border-surface-300/30">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-surface-200 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Próximo treino — {nextWorkout.dayLabel}</p>
                  <p className="font-display font-bold text-sm truncate">{nextWorkout.name}</p>
                  <p className="text-[11px] text-muted-foreground">{nextWorkout.exerciseCount} exercícios{nextWorkout.goal ? ` · ${nextWorkout.goal}` : ''}</p>
                </div>
                <Link href={`/treinos/${nextWorkout.id}`} className="flex-shrink-0 text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  Ver <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* Sem ficha */}
          {studentStats.activeSheets === 0 && (
            <motion.div variants={fadeUp} className="glass rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Nenhuma ficha atribuída</p>
                  <p className="text-xs text-muted-foreground mt-1">Aguarde seu personal trainer criar uma ficha de treino para você.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Último treino */}
          {lastWorkout && (
            <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
              <h3 className="font-display font-bold text-sm mb-3">Último treino</h3>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{lastWorkout.sheetName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(lastWorkout.createdAt)}</p>
                    {lastWorkout.durationSeconds && (
                      <p className="text-xs text-brand-400 flex items-center gap-1">
                        <Timer className="w-3 h-3" />{formatDuration(lastWorkout.durationSeconds)}
                      </p>
                    )}
                  </div>
                </div>
                <Link href="/historico" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 flex-shrink-0">
                  Histórico <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* Evolução mensal */}
          {monthlyWorkouts.length > 0 && (
            <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="font-display font-bold">Evolução mensal</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Treinos realizados nos últimos 6 meses</p>
                </div>
                <Link href="/historico" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  Histórico <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyWorkouts} barCategoryGap="30%">
                  <XAxis dataKey="month" axisLine={false} tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 6 }}
                    contentStyle={{ background: '#0f1117', border: '1px solid #1e2433', borderRadius: '10px', fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#818cf8' }}
                    formatter={(v: number) => [`${v} treino${v !== 1 ? 's' : ''}`, '']}
                  />
                  <Bar dataKey="count" fill="#6366F1" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Heatmap */}
            <motion.div variants={fadeUp} className="xl:col-span-2 glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold">Mapa de frequência</h3>
                <Link href="/frequencia" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  Ver detalhes <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <FrequencyHeatmap />
              <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
                <span>Menos</span>
                <div className="flex gap-1">
                  {['bg-surface-200','bg-brand-900','bg-brand-700','bg-brand-500','bg-brand-400'].map(c => (
                    <div key={c} className={cn('w-2.5 h-2.5 rounded-sm', c)} />
                  ))}
                </div>
                <span>Mais</span>
              </div>
            </motion.div>

            {/* Right col */}
            <motion.div variants={fadeUp} className="space-y-4">
              {/* Acesso rápido */}
              <div className="glass rounded-2xl p-4">
                <h3 className="font-display font-bold text-sm mb-3">Acesso rápido</h3>
                <QuickAction icon={Dumbbell}      label="Meus treinos"    sublabel="Fichas do personal"    href="/treinos"    color="#6366F1" />
                <QuickAction icon={CalendarCheck} label="Minha agenda"    href="/agenda"    color="#10B981" />
                <QuickAction icon={TrendingUp}    label="Evolução"        sublabel="Gráficos e progresso"  href="/evolucao"   color="#F97316" />
                <QuickAction icon={Activity}      label="Frequência"      href="/frequencia" color="#06B6D4" />
                <QuickAction icon={Video} label="Biblioteca de vídeos" sublabel="Execução de exercícios" href="/videos" color="#10B981" />
              </div>

              {/* Perfil incompleto */}
              {!profile?.goal && (
                <div className="glass rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
                  <p className="text-xs font-semibold text-amber-300 mb-1">Perfil incompleto</p>
                  <p className="text-[10px] text-muted-foreground mb-2">Adicione seus dados físicos para acompanhar sua evolução.</p>
                  <Link href="/perfil" className="text-xs text-amber-400 font-semibold flex items-center gap-1 hover:underline">
                    Completar perfil <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Conquistas */}
          {studentStats.totalWorkouts > 0 && (
            <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold">Conquistas</h3>
                <span className="text-xs text-muted-foreground">
                  {BADGES.filter(b => b.condition(studentStats.totalWorkouts, studentStats.streak)).length}/{BADGES.length} desbloqueadas
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BADGES.map(badge => {
                  const earned = badge.condition(studentStats.totalWorkouts, studentStats.streak)
                  return (
                    <div key={badge.id} title={earned ? badge.desc : `${badge.desc} para desbloquear`}
                      className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border transition-all',
                        earned ? 'bg-brand-500/10 border-brand-500/20' : 'bg-surface-100 border-surface-200 opacity-40 grayscale')}>
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

          {/* Bio & medidas */}
          {profile && (
            <motion.div variants={fadeUp}>
              <StudentBioView studentId={profile.id} />
            </motion.div>
          )}

        </>
      )}

      {/* No role */}
      {!currentRole && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-display font-bold">Você ainda não está em nenhuma academia</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
            {accountType === 'owner'
              ? 'Crie sua academia para convidar alunos e gerenciar treinos.'
              : accountType === 'personal'
                ? 'Termine seu cadastro para começar a gerenciar seus alunos.'
                : 'Aceite o convite do seu personal trainer para começar.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {accountType === 'owner' && (
              <Link href="/onboarding?type=owner" className="btn-primary text-sm py-2.5 px-5 rounded-xl">Criar academia</Link>
            )}
            {accountType === 'personal' && (
              <Link href="/onboarding" className="btn-primary text-sm py-2.5 px-5 rounded-xl">Continuar cadastro</Link>
            )}
            {accountType !== 'personal' && (
              <Link href="/codigo?from=dashboard" className="btn-secondary text-sm py-2.5 px-5 rounded-xl">Tenho um convite</Link>
            )}
          </div>
        </motion.div>
      )}

    </motion.div>
    </MotionConfig>
  )
}

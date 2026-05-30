'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Activity, TrendingUp, Calendar, ArrowUpRight,
  Dumbbell, ChevronRight, Plus, UserPlus, Building2,
  ClipboardList, ArrowRight, Flame, AlertTriangle, Clock, Play, CheckCircle2,
  ShieldCheck, BarChart3, BookOpen, CalendarCheck, Trophy, Timer, Check,
  Video, Sparkles, X, Loader2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

import { toast } from 'sonner'

import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { FrequencyHeatmap } from '@/components/charts/frequency-heatmap'
import { createClient } from '@/lib/supabase/client'
import { StudentBioView } from '@/components/bioimpedance/student-bio-view'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }

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

const PLAN_INFO: Record<string, { name: string; color: string; emoji: string }> = {
  solo:  { name: 'Solo',  color: '#6366F1', emoji: '⚡' },
  plus:  { name: 'Plus',  color: '#06B6D4', emoji: '💎' },
  elite: { name: 'Elite', color: '#10B981', emoji: '👑' },
}

const OWNER_PLAN_INFO: Record<string, { name: string; color: string; emoji: string; price: string; trial?: boolean; features: string[] }> = {
  starter: { name: 'Starter', color: '#06B6D4', emoji: '⚡', price: 'R$ 197/mês', trial: true,  features: ['Até 50 alunos', 'Até 3 personais', 'Fichas ilimitadas', 'Dashboard básico', 'Convites por código'] },
  pro:     { name: 'Pro',     color: '#10B981', emoji: '👑', price: 'R$ 397/mês',               features: ['Alunos ilimitados', 'Personais ilimitados', 'Relatórios avançados', 'Mapa de frequência detalhado', 'Exportar dados (CSV)', 'Notificações de inatividade', 'Personalização da academia', 'Histórico completo por aluno', 'Suporte prioritário'] },
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
// Helpers
// ─────────────────────────────────────────────────────────────
function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function computeStreak(timestamps: string[]) {
  if (!timestamps.length) return 0
  const daySet = new Set(timestamps.map(t => dateKey(new Date(t))))
  const cursor = new Date(); cursor.setHours(0, 0, 0, 0)
  if (!daySet.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (daySet.has(dateKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1) }
  return streak
}
function formatTimeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  if (days < 7) return `${days}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}
function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

// ─────────────────────────────────────────────────────────────
// UI components
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, icon: Icon, color, suffix = '', empty = false, warning = false }: {
  label: string; value: number; delta?: string; icon: React.ComponentType<{ className?: string }>
  color: string; suffix?: string; empty?: boolean; warning?: boolean
}) {
  return (
    <motion.div variants={fadeUp} className={cn(
      'stat-card group transition-all duration-300 hover:-translate-y-0.5',
      warning ? 'hover:border-amber-500/30' : 'hover:border-brand-500/20',
    )}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
          <span style={{ color }}><Icon className="w-4 h-4" /></span>
        </div>
        {delta && !empty && (
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
            delta.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')}>
            <ArrowUpRight className="w-3 h-3" />{delta}
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

function EmptyState({ icon: Icon, title, description, cta, ctaHref }: {
  icon: React.ComponentType<{ className?: string }>; title: string; description: string; cta: string; ctaHref: string
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

function AlertBanner({ icon: Icon, color, children }: {
  icon: React.ComponentType<{ className?: string }>; color: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border"
      style={{ background: `${color}08`, borderColor: `${color}20` }}>
      <span style={{ color }}><Icon className="w-4 h-4 flex-shrink-0" /></span>
      <p className="text-xs">{children}</p>
    </div>
  )
}

function QuickAction({ icon: Icon, label, sublabel, href, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; sublabel?: string; href: string; color: string
}) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-all group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
        style={{ background: `${color}18` }}>
        <span style={{ color }}><Icon className="w-4 h-4" /></span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { currentRole, profile, currentAcademy } = useAuthStore()
  const supabase = createClient()
  const isOwner    = currentRole === 'owner'
  const isPersonal = currentRole === 'personal'
  const isStudent  = currentRole === 'student'

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

  async function handleUpgrade(planId: string) {
    setUpgrading(planId)
    try {
      const res = await fetch('/api/billing/student-checkout', {
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
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const [monthlyWorkouts, setMonthlyWorkouts] = useState<MonthlyWorkout[]>([])
  const [freeCategory,    setFreeCategory]    = useState<string | null>(null)
  const [freeDuration,    setFreeDuration]    = useState<number | null>(null)
  const [freeLogging,     setFreeLogging]     = useState(false)
  const [freeLoggedToday, setFreeLoggedToday] = useState(false)
  const [weekActivity,    setWeekActivity]    = useState<boolean[]>(Array(7).fill(false))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') === 'success') setShowSuccessBanner(true)
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAccountType(user?.user_metadata?.account_type ?? 'owner')
      const plan = user?.user_metadata?.subscription_plan ?? params.get('plan') ?? null
      setSubscriptionPlan(plan)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!currentAcademy) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const aid = currentAcademy.id
    if (isOwner)    loadOwnerData(sb, aid)
    if (isPersonal) loadPersonalData(sb, aid)
    if (isStudent)  loadStudentData(sb, aid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAcademy, currentRole])

  // ── Owner data ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function loadOwnerData(sb: any, aid: string) {
    const now = new Date()
    const weekAgo     = new Date(now); weekAgo.setDate(now.getDate() - 7)
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)
    const monthAgo    = new Date(now); monthAgo.setDate(now.getDate() - 30)

    const [
      { count: totalStudents },
      { count: activePersonals },
      { data: weeklyLogs },
      { count: workoutsLastWeek },
      { count: newThisMonth },
      { data: recentMembersRaw },
      { data: recentWorkoutsRaw },
      { data: allStudentsRaw },
      { data: personaisRaw },
    ] = await Promise.all([
      sb.from('academy_members').select('id', { count: 'exact', head: true }).eq('academy_id', aid).eq('role', 'student').eq('is_active', true),
      sb.from('academy_members').select('id', { count: 'exact', head: true }).eq('academy_id', aid).eq('role', 'personal').eq('is_active', true),
      sb.from('workout_logs').select('student_id').eq('academy_id', aid).gte('created_at', weekAgo.toISOString()),
      sb.from('workout_logs').select('id', { count: 'exact', head: true }).eq('academy_id', aid).gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', weekAgo.toISOString()),
      sb.from('academy_members').select('id', { count: 'exact', head: true }).eq('academy_id', aid).eq('role', 'student').gte('joined_at', monthAgo.toISOString()),
      sb.from('academy_members').select('id, joined_at, user_id').eq('academy_id', aid).eq('role', 'student').eq('is_active', true).order('joined_at', { ascending: false }).limit(5),
      sb.from('workout_logs').select('id, created_at, student_id, duration_seconds, sheet_id').eq('academy_id', aid).order('created_at', { ascending: false }).limit(8),
      sb.from('academy_members').select('user_id').eq('academy_id', aid).eq('role', 'student').eq('is_active', true).limit(100),
      sb.from('academy_members').select('user_id').eq('academy_id', aid).eq('role', 'personal').eq('is_active', true),
    ])

    const activeSet = new Set((weeklyLogs ?? []).map((l: { student_id: string }) => l.student_id))
    const total     = totalStudents ?? 0
    const allStudentIds: string[] = (allStudentsRaw ?? []).map((m: { user_id: string }) => m.user_id)
    const inactiveIds = allStudentIds.filter(id => !activeSet.has(id))
    const personaisIds: string[] = (personaisRaw ?? []).map((p: { user_id: string }) => p.user_id)

    const memberUserIds = (recentMembersRaw ?? []).map((m: { user_id: string }) => m.user_id) as string[]
    const workoutsRaw   = (recentWorkoutsRaw ?? []) as Array<{ student_id: string; sheet_id: string }>
    const wStudentIds   = [...new Set(workoutsRaw.map(w => w.student_id))]
    const sheetIds      = workoutsRaw.map(w => w.sheet_id).filter(Boolean) as string[]
    const allUserIds    = [...new Set([...memberUserIds, ...wStudentIds, ...inactiveIds, ...personaisIds])]

    const [{ data: profiles }, { data: sheets }, { data: activeSheetsData }, { data: personalSheets }] = await Promise.all([
      allUserIds.length > 0 ? sb.from('profiles').select('id, full_name').in('id', allUserIds) : { data: [] },
      sheetIds.length   > 0 ? sb.from('workout_sheets').select('id, name').in('id', sheetIds)  : { data: [] },
      sb.from('workout_sheets').select('student_id').eq('academy_id', aid).eq('is_active', true),
      personaisIds.length > 0 ? sb.from('workout_sheets').select('personal_id, student_id').eq('academy_id', aid).eq('is_active', true).in('personal_id', personaisIds) : { data: [] },
    ])

    type ProfileRow = { id: string; full_name: string }
    type SheetRow   = { id: string; name: string }
    const profileMap = new Map((profiles ?? []).map((p: ProfileRow) => [p.id, p.full_name]))
    const sheetMap   = new Map((sheets ?? []).map((s: SheetRow) => [s.id, s.name]))
    const withSheets = new Set((activeSheetsData ?? []).map((s: { student_id: string }) => s.student_id))
    const noSheets   = allStudentIds.filter(id => !withSheets.has(id)).length

    setOwnerMetrics({
      totalStudents: total,
      activePersonals: activePersonals ?? 0,
      activeThisWeek: activeSet.size,
      inactiveCount: Math.max(0, total - activeSet.size),
      workoutsThisWeek: weeklyLogs?.length ?? 0,
      workoutsLastWeek: workoutsLastWeek ?? 0,
      newThisMonth: newThisMonth ?? 0,
      studentsWithoutSheets: noSheets,
    })

    setRecentMembers((recentMembersRaw ?? []).map((m: { id: string; user_id: string; joined_at: string }) => ({
      id: m.id, userId: m.user_id, joinedAt: m.joined_at,
      fullName: (profileMap.get(m.user_id) as string | undefined) ?? 'Usuário',
    })))

    setRecentWorkouts((recentWorkoutsRaw ?? []).map((w: { id: string; created_at: string; student_id: string; sheet_id: string; duration_seconds: number | null }) => ({
      id: w.id, createdAt: w.created_at,
      studentName: (profileMap.get(w.student_id) as string | undefined) ?? 'Aluno',
      sheetName: (sheetMap.get(w.sheet_id) as string | undefined) ?? 'Treino',
      durationSeconds: w.duration_seconds,
    })))

    // Personal performance
    const pStudentMap = new Map<string, Set<string>>()
    for (const s of (personalSheets ?? [])) {
      if (!pStudentMap.has(s.personal_id)) pStudentMap.set(s.personal_id, new Set())
      pStudentMap.get(s.personal_id)!.add(s.student_id)
    }
    setPersonaisPerf(personaisIds.map(id => ({
      userId: id,
      fullName: (profileMap.get(id) as string | undefined) ?? 'Personal',
      studentCount: pStudentMap.get(id)?.size ?? 0,
    })))

    // Inactive with last workout
    if (inactiveIds.length > 0) {
      const { data: lastLogs } = await sb.from('workout_logs').select('student_id, created_at').eq('academy_id', aid).in('student_id', inactiveIds).order('created_at', { ascending: false })
      const lastMap = new Map<string, string>()
      for (const log of (lastLogs ?? [])) { if (!lastMap.has(log.student_id)) lastMap.set(log.student_id, log.created_at) }
      setInactiveStudents(inactiveIds.slice(0, 8).map(id => ({
        userId: id,
        fullName: (profileMap.get(id) as string | undefined) ?? 'Aluno',
        lastWorkoutAt: lastMap.get(id) ?? null,
      })))
    }
  }

  // ── Personal data ───────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function loadPersonalData(sb: any, aid: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const weekAgo    = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

    const { data: mySheets } = await sb.from('workout_sheets').select('student_id, is_active').eq('personal_id', user.id).eq('academy_id', aid)
    const myStudentIds = [...new Set((mySheets ?? []).map((s: { student_id: string }) => s.student_id))] as string[]
    const activeSheetStudents = new Set((mySheets ?? []).filter((s: { is_active: boolean }) => s.is_active).map((s: { student_id: string }) => s.student_id))

    if (myStudentIds.length === 0) {
      setPersonalMetrics({ myStudentsCount: 0, trainedTodayCount: 0, activeSheetsCount: 0, inactiveCount: 0 })
      return
    }

    const [{ data: recentLogs }, { data: todayLogs }, { data: profiles }, { data: myRecentRaw }, { data: mySheetNames }] = await Promise.all([
      sb.from('workout_logs').select('student_id, created_at').eq('academy_id', aid).in('student_id', myStudentIds).gte('created_at', weekAgo.toISOString()),
      sb.from('workout_logs').select('student_id').eq('academy_id', aid).in('student_id', myStudentIds).gte('created_at', todayStart.toISOString()),
      sb.from('profiles').select('id, full_name').in('id', myStudentIds),
      sb.from('workout_logs').select('id, created_at, student_id, duration_seconds, sheet_id').eq('academy_id', aid).in('student_id', myStudentIds).order('created_at', { ascending: false }).limit(8),
      sb.from('workout_sheets').select('id, name').eq('personal_id', user.id).eq('academy_id', aid),
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
          setNextWorkout({ id: s.id, name: s.name, goal: s.goal, exerciseCount: s.sheet_exercises?.length ?? 0, dayLabel: DAY_LABELS[nextDay] })
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
  const trainedToday    = weekActivity[6] === true || freeLoggedToday || (todayWorkout?.alreadyDone ?? false)
  const streakAtRisk    = studentStats.streak > 0 && !trainedToday

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Welcome */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-display font-bold">
            {greeting()}, {profile?.full_name?.split(' ')[0] ?? 'usuário'} 👋
          </h2>
          {isStudent && subscriptionPlan && PLAN_INFO[subscriptionPlan] && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: `${PLAN_INFO[subscriptionPlan].color}18`, color: PLAN_INFO[subscriptionPlan].color, border: `1px solid ${PLAN_INFO[subscriptionPlan].color}30` }}>
              {PLAN_INFO[subscriptionPlan].emoji} Plano {PLAN_INFO[subscriptionPlan].name}
            </span>
          )}
          {isOwner && currentAcademy?.plan && OWNER_PLAN_INFO[currentAcademy.plan] && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: `${OWNER_PLAN_INFO[currentAcademy.plan].color}18`, color: OWNER_PLAN_INFO[currentAcademy.plan].color, border: `1px solid ${OWNER_PLAN_INFO[currentAcademy.plan].color}30` }}>
              {OWNER_PLAN_INFO[currentAcademy.plan].emoji} Plano {OWNER_PLAN_INFO[currentAcademy.plan].name}
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

      {isOwner && hasAcademy && (
        <>
          {/* KPIs — 4 cards */}
          <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total de alunos"  value={ownerMetrics.totalStudents}   delta={ownerMetrics.newThisMonth > 0 ? `+${ownerMetrics.newThisMonth}` : undefined} icon={Users}       color="#6366F1" empty={ownerMetrics.totalStudents === 0} />
            <StatCard label="Novos este mês"   value={ownerMetrics.newThisMonth}                                                                                          icon={UserPlus}    color="#10B981" empty={ownerMetrics.newThisMonth === 0} />
            <StatCard label="Personais ativos" value={ownerMetrics.activePersonals}                                                                                       icon={ShieldCheck} color="#8B5CF6" empty={ownerMetrics.activePersonals === 0} />
            <StatCard label="Engajamento"      value={engagementPct} suffix="%"                                                                                           icon={Activity}    color="#06B6D4" empty={ownerMetrics.totalStudents === 0} />
          </motion.div>

          {/* Main 2/3 + 1/3 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left col — financeiro + crescimento */}
            <motion.div variants={fadeUp} className="xl:col-span-2 space-y-4">

              {/* Plano / financeiro */}
              {currentAcademy?.plan && OWNER_PLAN_INFO[currentAcademy.plan] && (() => {
                const p = OWNER_PLAN_INFO[currentAcademy.plan!]
                const isStarter = currentAcademy.plan === 'starter'
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
                        <div className="rounded-xl p-3 mb-3" style={{ background: `${OWNER_PLAN_INFO.pro.color}0A`, border: `1px solid ${OWNER_PLAN_INFO.pro.color}20` }}>
                          <p className="text-[11px] font-bold mb-1.5" style={{ color: OWNER_PLAN_INFO.pro.color }}>👑 Pro desbloqueia:</p>
                          <ul className="grid grid-cols-2 gap-1">
                            {PRO_UPGRADE_FEATURES.slice(0, 4).map(f => (
                              <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Check className="w-2.5 h-2.5 flex-shrink-0" style={{ color: OWNER_PLAN_INFO.pro.color }} />{f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button onClick={() => handleOwnerPlanChange('pro')} disabled={!!upgrading}
                          className="w-full text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                          style={{ background: `${OWNER_PLAN_INFO.pro.color}15`, color: OWNER_PLAN_INFO.pro.color, border: `1px solid ${OWNER_PLAN_INFO.pro.color}25` }}>
                          {upgrading === 'pro' ? <Loader2 className="w-3 h-3 animate-spin" /> : <>👑 Fazer upgrade para Pro — R$ 397/mês</>}
                        </button>
                      </>
                    )}
                    {currentAcademy.plan === 'pro' && (
                      <p className="text-[11px] text-center text-emerald-400 font-semibold">Você está no plano máximo 🎉</p>
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
            </motion.div>

            {/* Right col */}
            <motion.div variants={fadeUp} className="space-y-4">
              {/* Ações rápidas */}
              <div className="glass rounded-2xl p-4">
                <h3 className="font-display font-bold text-sm mb-3">Ações rápidas</h3>
                <QuickAction icon={UserPlus}    label="Convidar aluno"        href="/alunos"       color="#06B6D4" />
                <QuickAction icon={ShieldCheck} label="Gerenciar personais"   href="/personais"    color="#8B5CF6" />
                <QuickAction icon={Dumbbell}    label="Nova ficha de treino"  href="/treinos/novo" color="#6366F1" />
                <QuickAction icon={BarChart3}   label="Ver frequência"        href="/frequencia"   color="#F59E0B" />
                <QuickAction icon={BookOpen}    label="Banco de exercícios"   href="/exercicios"   color="#10B981" />
              </div>

              {/* Personais */}
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
            </motion.div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          PERSONAL
      ════════════════════════════════════════ */}
      {isPersonal && (
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
            {/* My students */}
            <motion.div variants={fadeUp} className="xl:col-span-2 glass rounded-2xl p-5">
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
      {isStudent && (
        <>
          {/* Banner de boas-vindas após pagamento */}
          {showSuccessBanner && subscriptionPlan && PLAN_INFO[subscriptionPlan] && (
            <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl p-5 border"
              style={{ background: `${PLAN_INFO[subscriptionPlan].color}10`, borderColor: `${PLAN_INFO[subscriptionPlan].color}25` }}>
              <button onClick={() => setShowSuccessBanner(false)}
                className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${PLAN_INFO[subscriptionPlan].color}18` }}>
                  {PLAN_INFO[subscriptionPlan].emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-base" style={{ color: PLAN_INFO[subscriptionPlan].color }}>
                    Bem-vindo ao Plano {PLAN_INFO[subscriptionPlan].name}!
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Sua assinatura está ativa. Explore seus treinos, acompanhe sua frequência e evolução.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link href="/treinos" className="text-xs font-semibold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1"
                      style={{ background: `${PLAN_INFO[subscriptionPlan].color}20`, color: PLAN_INFO[subscriptionPlan].color }}>
                      <Dumbbell className="w-3 h-3" /> Meus treinos
                    </Link>
                    {subscriptionPlan === 'elite' && (
                      <Link href="/videos" className="text-xs font-semibold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1"
                        style={{ background: `${PLAN_INFO[subscriptionPlan].color}20`, color: PLAN_INFO[subscriptionPlan].color }}>
                        <Video className="w-3 h-3" /> Biblioteca de vídeos
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
                {subscriptionPlan === 'elite' && (
                  <QuickAction icon={Video} label="Biblioteca de vídeos" sublabel="Execução de exercícios" href="/videos" color="#10B981" />
                )}
                {subscriptionPlan && subscriptionPlan !== 'elite' && (
                  <Link href="/videos" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-200 transition-all group opacity-60">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-surface-200">
                      <Video className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Vídeos</p>
                      <p className="text-[10px] text-muted-foreground">Plano Elite</p>
                    </div>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400/70" />
                  </Link>
                )}
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

          {/* Upgrade de plano */}
          {!subscriptionPlan && (
            <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm">Desbloquear recursos premium</h3>
                  <p className="text-xs text-muted-foreground">Vídeos de execução, gráficos avançados e mais</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'solo',  name: 'Solo',  price: 'R$ 29', color: '#6366F1', popular: false, features: ['Histórico avançado', 'Gráficos de evolução', 'Conquistas e metas'] },
                  { id: 'plus',  name: 'Plus',  price: 'R$ 49', color: '#06B6D4', popular: true,  features: ['Tudo do Solo', 'Notificações de treino', 'Relatórios semanais'] },
                  { id: 'elite', name: 'Elite', price: 'R$ 89', color: '#10B981', popular: false, features: ['Tudo do Plus', 'Vídeos de execução', 'Suporte prioritário'] },
                ].map(p => (
                  <div key={p.id} className={cn('rounded-xl p-3.5 border flex flex-col gap-2',
                    p.popular ? 'border-brand-500/30 bg-brand-500/5' : 'border-surface-300/20 bg-surface-100')}>
                    {p.popular && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 w-fit">Mais popular</span>
                    )}
                    <div>
                      <span className="text-lg font-display font-extrabold" style={{ color: p.color }}>{p.price}</span>
                      <span className="text-[10px] text-muted-foreground">/mês</span>
                    </div>
                    <p className="font-semibold text-xs">{p.name}</p>
                    <ul className="space-y-1 flex-1">
                      {p.features.map(f => (
                        <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Check className="w-2.5 h-2.5 flex-shrink-0" style={{ color: p.color }} />{f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleUpgrade(p.id)}
                      disabled={!!upgrading}
                      className="mt-1 w-full text-[11px] font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}25` }}
                    >
                      {upgrading === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Assinar'}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-3">Cancele quando quiser · Sem fidelidade</p>
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
              : 'Aceite o convite do seu personal trainer para começar.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {accountType === 'owner' && (
              <Link href="/onboarding?type=owner" className="btn-primary text-sm py-2.5 px-5 rounded-xl">Criar academia</Link>
            )}
            <Link href="/codigo?from=dashboard" className="btn-secondary text-sm py-2.5 px-5 rounded-xl">Tenho um convite</Link>
          </div>
        </motion.div>
      )}

    </motion.div>
  )
}

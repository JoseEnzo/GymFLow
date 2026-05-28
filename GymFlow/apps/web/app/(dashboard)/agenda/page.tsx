'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, CheckCircle2, Circle,
  Dumbbell, Play, CalendarDays, Target, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_LABELS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const GOAL_COLORS: Record<string, string> = {
  'Hipertrofia': '#6366F1',
  'Força': '#10B981',
  'Condicionamento': '#06B6D4',
  'Perda de peso': '#F97316',
  'Reabilitação': '#F59E0B',
  'Flexibilidade': '#EC4899',
}

interface ScheduledSheet {
  id: string
  name: string
  goal: string | null
  scheduled_days: number[]
  exercise_count: number
}

interface AgendaCompletion {
  id: string
  sheet_id: string
  completed_on: string
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0] ?? ''
}

function formatWeekRange(start: Date): string {
  const end = addDays(start, 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('pt-BR', opts)} — ${end.toLocaleDateString('pt-BR', opts)}`
}

interface DayCardProps {
  date: Date
  isToday: boolean
  isPast: boolean
  sheet: ScheduledSheet | null
  completed: boolean
  onToggle: (date: Date, sheet: ScheduledSheet) => void
  toggling: boolean
}

function DayCard({ date, isToday, isPast, sheet, completed, onToggle, toggling }: DayCardProps) {
  const dayIndex = date.getDay()
  const dayLabel = DAY_LABELS[dayIndex]
  const dayNum = date.getDate()
  const color = sheet ? (GOAL_COLORS[sheet.goal ?? ''] ?? '#6366F1') : null

  return (
    <motion.div
      layout
      className={cn(
        'glass rounded-2xl overflow-hidden flex flex-col transition-all duration-300',
        isToday && 'ring-1 ring-brand-500/40 shadow-[0_0_20px_rgba(29,158,117,0.08)]',
        !sheet && 'opacity-50',
      )}
    >
      {/* Colored top bar */}
      <div
        className="h-1 flex-shrink-0"
        style={{
          background: color
            ? `linear-gradient(90deg, ${color}, ${color}44)`
            : 'transparent',
        }}
      />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Day header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
              isToday
                ? 'bg-brand-500 text-white'
                : 'bg-surface-200 text-muted-foreground'
            )}>
              {dayNum}
            </div>
            <span className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              isToday ? 'text-brand-400' : 'text-muted-foreground'
            )}>
              {dayLabel}
            </span>
          </div>

          {completed && (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" style={{ width: '1.125rem', height: '1.125rem' }} />
          )}
        </div>

        {/* Workout content */}
        {sheet ? (
          <div className="flex-1 flex flex-col gap-3">
            <div>
              {sheet.goal && (
                <span
                  className="badge text-[10px] mb-1"
                  style={{ background: `${color}15`, color: color!, borderColor: `${color}30` }}
                >
                  {sheet.goal}
                </span>
              )}
              <p className="font-display font-bold text-sm leading-snug">{sheet.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Dumbbell className="w-2.5 h-2.5" />
                {sheet.exercise_count} exercícios
              </p>
            </div>

            <div className="flex gap-2 mt-auto">
              {!completed ? (
                <>
                  <button
                    onClick={() => onToggle(date, sheet)}
                    disabled={toggling}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all',
                      'border border-border/60 text-muted-foreground hover:text-foreground hover:bg-surface-200',
                      toggling && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {toggling ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Circle className="w-3 h-3" />
                    )}
                    Concluir
                  </button>
                  {(isToday || isPast) && (
                    <Link
                      href={`/treinos/executar/${sheet.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: `${color}15`, color: color!, border: `1px solid ${color}30` }}
                    >
                      <Play className="w-3 h-3" />
                      Iniciar
                    </Link>
                  )}
                </>
              ) : (
                <button
                  onClick={() => onToggle(date, sheet)}
                  disabled={toggling}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all',
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
                    toggling && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {toggling ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  Concluído
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-2">
            <p className="text-[11px] text-muted-foreground/50 italic">Descanso</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function AgendaPage() {
  const { currentAcademy, profile } = useAuthStore()
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [sheets, setSheets] = useState<ScheduledSheet[]>([])
  const [completions, setCompletions] = useState<AgendaCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null) // date string being toggled

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)

  const load = useCallback(async () => {
    if (!currentAcademy) { setLoading(false); return }
    setLoading(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sheetsRes, completionsRes] = await Promise.all([
      (supabase as any)
        .from('workout_sheets')
        .select('id, name, goal, scheduled_days, sheet_exercises(id)')
        .eq('academy_id', currentAcademy.id)
        .eq('is_active', true)
        .not('scheduled_days', 'eq', '{}'),

      (supabase as any)
        .from('agenda_completions')
        .select('id, sheet_id, completed_on')
        .eq('academy_id', currentAcademy.id)
        .gte('completed_on', toDateStr(weekStart))
        .lte('completed_on', toDateStr(weekEnd)),
    ])

    if (sheetsRes.error) toast.error('Erro ao carregar treinos.')
    if (completionsRes.error) toast.error('Erro ao carregar agenda.')

    setSheets(
      (sheetsRes.data ?? []).map((s: any) => ({
        ...s,
        exercise_count: s.sheet_exercises?.length ?? 0,
      }))
    )
    setCompletions(completionsRes.data ?? [])
    setLoading(false)
  }, [currentAcademy, weekStart])

  useEffect(() => { load() }, [load])

  function getSheetForDay(dayIndex: number): ScheduledSheet | null {
    return sheets.find((s) => s.scheduled_days.includes(dayIndex)) ?? null
  }

  function isCompleted(date: Date, sheetId: string): boolean {
    const dateStr = toDateStr(date)
    return completions.some((c) => c.sheet_id === sheetId && c.completed_on === dateStr)
  }

  async function handleToggle(date: Date, sheet: ScheduledSheet) {
    if (!currentAcademy || !profile) return
    const dateStr = toDateStr(date)
    const key = `${dateStr}-${sheet.id}`
    setToggling(key)

    const existing = completions.find(
      (c) => c.sheet_id === sheet.id && c.completed_on === dateStr
    )

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('agenda_completions')
        .delete()
        .eq('id', existing.id)

      if (error) { toast.error('Erro ao desfazer conclusão.'); setToggling(null); return }
      setCompletions((prev) => prev.filter((c) => c.id !== existing.id))
      toast.success('Treino desmarcado.')
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('agenda_completions')
        .insert({
          student_id: profile.id,
          sheet_id: sheet.id,
          academy_id: currentAcademy.id,
          completed_on: dateStr,
        })
        .select('id, sheet_id, completed_on')
        .single()

      if (error) { toast.error('Erro ao marcar como concluído.'); setToggling(null); return }
      setCompletions((prev) => [...prev, data])
      toast.success('Treino concluído! 💪')
    }

    setToggling(null)
  }

  const completedThisWeek = weekDays.filter((date) => {
    const sheet = getSheetForDay(date.getDay())
    return sheet && isCompleted(date, sheet.id)
  }).length

  const scheduledThisWeek = weekDays.filter((date) =>
    getSheetForDay(date.getDay()) !== null
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="section-title">Agenda semanal</h2>
          <p className="section-subtitle mt-1">
            {loading ? 'Carregando...' : `${completedThisWeek} de ${scheduledThisWeek} treinos concluídos esta semana`}
          </p>
        </div>

        {/* Week navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-muted-foreground min-w-[160px] text-center">
            {formatWeekRange(weekStart)}
          </span>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="p-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="px-3 py-2 rounded-xl border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
          >
            Hoje
          </button>
        </div>
      </motion.div>

      {/* Progress bar */}
      {!loading && scheduledThisWeek > 0 && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="glass rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Progresso da semana</span>
              <span className="text-xs font-bold text-brand-400">
                {scheduledThisWeek > 0 ? Math.round((completedThisWeek / scheduledThisWeek) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                initial={{ width: 0 }}
                animate={{
                  width: scheduledThisWeek > 0
                    ? `${(completedThisWeek / scheduledThisWeek) * 100}%`
                    : '0%'
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-lg leading-none">{completedThisWeek}/{scheduledThisWeek}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">treinos</p>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden">
              <Skeleton className="h-1 rounded-none" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state — no sheets scheduled */}
      {!loading && sheets.length === 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="text-center py-20"
        >
          <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-muted-foreground">Nenhum treino agendado</p>
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs mx-auto">
            Seu personal trainer ainda não configurou dias de treino para suas fichas.
          </p>
          <Link href="/treinos" className="btn-secondary text-sm py-2 px-4 rounded-xl mt-4 inline-flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" />
            Ver fichas de treino
          </Link>
        </motion.div>
      )}

      {/* Week grid */}
      {!loading && sheets.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3"
        >
          {weekDays.map((date, i) => {
            const sheet = getSheetForDay(date.getDay())
            const dateStr = toDateStr(date)
            const isPast = date < today
            const isToday = toDateStr(date) === toDateStr(today)
            const done = sheet ? isCompleted(date, sheet.id) : false
            const key = `${dateStr}-${sheet?.id}`

            return (
              <DayCard
                key={dateStr}
                date={date}
                isToday={isToday}
                isPast={isPast}
                sheet={sheet}
                completed={done}
                onToggle={handleToggle}
                toggling={toggling === key}
              />
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

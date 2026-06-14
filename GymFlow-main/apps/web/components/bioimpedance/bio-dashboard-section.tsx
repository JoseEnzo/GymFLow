'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Activity, ChevronRight, Scale, Droplets, Users } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface RecentAssessment {
  id: string
  studentId: string
  fullName: string
  assessedAt: string
  weightKg: number | null
  bodyFatPct: number | null
}

interface Props {
  academyId: string
  // Quando definido, filtra para os alunos do personal (role='personal').
  // Owner (academia ou solo) passa undefined pra ver todos os alunos da academia.
  personalId?: string
}

const PAGE_SIZE = 5
const RECENT_WINDOW_DAYS = 90

function formatRelative(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days}d`
  if (days < 365) return `há ${Math.floor(days / 30)}m`
  return `há ${Math.floor(days / 365)}a`
}

export function BioDashboardSection({ academyId, personalId }: Props) {
  const [loading, setLoading] = useState(true)
  const [recent, setRecent] = useState<RecentAssessment[]>([])
  const [studentsAssessed, setStudentsAssessed] = useState(0)
  const [studentsTotal, setStudentsTotal] = useState(0)
  // useMemo: createClient() no corpo + `supabase` nas deps do useEffect = loop
  // infinito de render. (Componente atualmente não montado, mas mantido correto.)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      // 1) IDs dos alunos no escopo (todos da academia OU só os do personal).
      let studentIds: string[] = []
      if (personalId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('workout_sheets')
          .select('student_id')
          .eq('academy_id', academyId)
          .eq('personal_id', personalId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentIds = Array.from(new Set((data ?? []).map((r: any) => r.student_id as string)))
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('academy_members')
          .select('user_id')
          .eq('academy_id', academyId)
          .eq('role', 'student')
          .eq('is_active', true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentIds = (data ?? []).map((r: any) => r.user_id as string)
      }

      if (cancelled) return
      setStudentsTotal(studentIds.length)

      if (studentIds.length === 0) {
        setRecent([])
        setStudentsAssessed(0)
        setLoading(false)
        return
      }

      // 2) Avaliações recentes (janela de 90 dias) — mais recente primeiro.
      const sinceIso = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: assessments } = await (supabase as any)
        .from('bioimpedance_assessments')
        .select('id, student_id, assessed_at, weight_kg, body_fat_pct')
        .eq('academy_id', academyId)
        .in('student_id', studentIds)
        .gte('assessed_at', sinceIso)
        .order('assessed_at', { ascending: false })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allRows = (assessments ?? []) as any[]

      // 3) Conta alunos únicos avaliados nos últimos 90d.
      const uniqAssessed = new Set<string>(allRows.map((r) => r.student_id as string))
      if (cancelled) return
      setStudentsAssessed(uniqAssessed.size)

      // 4) Mantém só a avaliação mais recente por aluno, depois corta em PAGE_SIZE.
      const seen = new Set<string>()
      const latestPerStudent = allRows.filter((r) => {
        if (seen.has(r.student_id)) return false
        seen.add(r.student_id)
        return true
      }).slice(0, PAGE_SIZE)

      // 5) Busca nomes dos alunos.
      const ids = latestPerStudent.map((r) => r.student_id as string)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles } = ids.length > 0
        ? await (supabase as any).from('profiles').select('id, full_name').in('id', ids)
        : { data: [] }
      const nameMap = new Map<string, string>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.full_name ?? 'Sem nome'))

      if (cancelled) return
      setRecent(latestPerStudent.map((r) => ({
        id: r.id as string,
        studentId: r.student_id as string,
        fullName: nameMap.get(r.student_id as string) ?? 'Sem nome',
        assessedAt: r.assessed_at as string,
        weightKg: r.weight_kg as number | null,
        bodyFatPct: r.body_fat_pct as number | null,
      })))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [academyId, personalId, supabase])

  const pct = studentsTotal > 0 ? Math.round((studentsAssessed / studentsTotal) * 100) : 0

  return (
    <motion.div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-display font-bold">Bioimpedância</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Últimos {RECENT_WINDOW_DAYS} dias</p>
          </div>
        </div>
        <Link href="/alunos" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
          Ver alunos <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* KPI */}
      <div className="mb-4 p-3 rounded-xl bg-surface-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Alunos avaliados</p>
          <p className="text-lg font-display font-bold mt-0.5">
            {studentsAssessed}
            <span className="text-muted-foreground text-xs font-normal"> / {studentsTotal}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-extrabold text-cyan-400">{pct}%</p>
          <p className="text-[10px] text-muted-foreground">cobertura</p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-surface-100/50 animate-pulse" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-surface-200 flex items-center justify-center mb-2">
            <Users className="w-4.5 h-4.5 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma avaliação recente</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            Abra um aluno para registrar peso, % de gordura e mais.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((r) => (
            <Link
              key={r.id}
              href={`/alunos/${r.studentId}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-cyan-400">
                  {r.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.fullName}</p>
                <p className="text-[10px] text-muted-foreground">{formatRelative(r.assessedAt)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {r.weightKg !== null && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Scale className="w-3 h-3" />
                    {r.weightKg.toFixed(1)}kg
                  </span>
                )}
                {r.bodyFatPct !== null && (
                  <span className={cn(
                    'flex items-center gap-1 text-xs font-semibold',
                    r.bodyFatPct < 15 ? 'text-emerald-400' : r.bodyFatPct < 25 ? 'text-cyan-400' : 'text-amber-400'
                  )}>
                    <Droplets className="w-3 h-3" />
                    {r.bodyFatPct.toFixed(1)}%
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  )
}

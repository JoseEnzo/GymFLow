'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Activity, ChevronRight, Scale, Droplets, Users,
  Search, AlertCircle, Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const RECENT_WINDOW_DAYS = 90

interface StudentRow {
  studentId: string
  fullName: string
  lastAssessmentId: string | null
  assessedAt: string | null
  weightKg: number | null
  bodyFatPct: number | null
  muscleMassKg: number | null
  bmi: number | null
}

function formatRelative(dateIso: string | null): string {
  if (!dateIso) return 'sem avaliação'
  const diffMs = Date.now() - new Date(dateIso).getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days}d`
  if (days < 365) return `há ${Math.floor(days / 30)}m`
  return `há ${Math.floor(days / 365)}a`
}

export default function BioimpedanciaPage() {
  const { currentAcademy, currentRole } = useAuthStore()
  const { profile } = useAuth()
  // useMemo: instância estável. createClient() no corpo + `supabase` nas deps do
  // useEffect = loop infinito de render ("Maximum update depth") que trava a aba.
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<StudentRow[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)

  // Quando personal sub-academia: filtra só os alunos vinculados a ele.
  // Owner (academia ou solo) vê todos os alunos da academia.
  const scopedPersonalId = currentRole === 'personal' ? profile?.id : undefined

  useEffect(() => {
    if (!currentAcademy?.id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const academyId = currentAcademy!.id

        // 1) IDs dos alunos no escopo
        let studentIds: string[] = []
        if (scopedPersonalId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error: sErr } = await (supabase as any)
            .from('workout_sheets')
            .select('student_id')
            .eq('academy_id', academyId)
            .eq('personal_id', scopedPersonalId)
          if (sErr) throw sErr
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          studentIds = Array.from(new Set((data ?? []).map((r: any) => r.student_id as string)))
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error: sErr } = await (supabase as any)
            .from('academy_members')
            .select('user_id')
            .eq('academy_id', academyId)
            .eq('role', 'student')
            .eq('is_active', true)
          if (sErr) throw sErr
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          studentIds = (data ?? []).map((r: any) => r.user_id as string)
        }

        if (cancelled) return

        if (studentIds.length === 0) {
          setRows([])
          setLoading(false)
          return
        }

        // 2) Nomes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profiles, error: pErr } = await (supabase as any)
          .from('profiles')
          .select('id, full_name')
          .in('id', studentIds)
        if (pErr) throw pErr
        const nameMap = new Map<string, string>()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.full_name ?? 'Sem nome'))

        // 3) Última avaliação por aluno (busca tudo desc e dedup)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: assessments, error: aErr } = await (supabase as any)
          .from('bioimpedance_assessments')
          .select('id, student_id, assessed_at, weight_kg, body_fat_pct, muscle_mass_kg, bmi')
          .eq('academy_id', academyId)
          .in('student_id', studentIds)
          .order('assessed_at', { ascending: false })
        if (aErr) throw aErr

        const seen = new Set<string>()
        const latestById = new Map<string, {
          id: string
          assessedAt: string
          weightKg: number | null
          bodyFatPct: number | null
          muscleMassKg: number | null
          bmi: number | null
        }>()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(assessments ?? []).forEach((r: any) => {
          if (seen.has(r.student_id)) return
          seen.add(r.student_id)
          latestById.set(r.student_id, {
            id: r.id,
            assessedAt: r.assessed_at,
            weightKg: r.weight_kg,
            bodyFatPct: r.body_fat_pct,
            muscleMassKg: r.muscle_mass_kg,
            bmi: r.bmi,
          })
        })

        // 4) Monta linhas — inclui também alunos sem avaliação
        const result: StudentRow[] = studentIds.map((sid) => {
          const last = latestById.get(sid)
          return {
            studentId: sid,
            fullName: nameMap.get(sid) ?? 'Sem nome',
            lastAssessmentId: last?.id ?? null,
            assessedAt: last?.assessedAt ?? null,
            weightKg: last?.weightKg ?? null,
            bodyFatPct: last?.bodyFatPct ?? null,
            muscleMassKg: last?.muscleMassKg ?? null,
            bmi: last?.bmi ?? null,
          }
        })

        // Ordena: com avaliação primeiro (mais recente no topo), depois sem avaliação por nome
        result.sort((a, b) => {
          if (a.assessedAt && b.assessedAt) {
            return new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime()
          }
          if (a.assessedAt) return -1
          if (b.assessedAt) return 1
          return a.fullName.localeCompare(b.fullName)
        })

        if (cancelled) return
        setRows(result)
      } catch (err) {
        if (cancelled) return
        setError((err as Error).message ?? 'Erro ao carregar avaliações.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [currentAcademy?.id, scopedPersonalId, supabase])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.fullName.toLowerCase().includes(q))
  }, [rows, debouncedSearch])

  const totalStudents = rows.length
  const assessedRecent = useMemo(() => {
    const cutoff = Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000
    return rows.filter((r) => r.assessedAt && new Date(r.assessedAt).getTime() >= cutoff).length
  }, [rows])
  const coverage = totalStudents > 0 ? Math.round((assessedRecent / totalStudents) * 100) : 0

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h2 className="section-title">Bioimpedância</h2>
        <p className="section-subtitle mt-1">
          Acompanhe as avaliações de composição corporal dos seus alunos.
        </p>
      </motion.div>

      {/* KPI */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Alunos no escopo</span>
          </div>
          <p className="text-2xl font-display font-extrabold">{totalStudents}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground">Avaliados em {RECENT_WINDOW_DAYS} dias</span>
          </div>
          <p className="text-2xl font-display font-extrabold">{assessedRecent}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Cobertura</span>
          </div>
          <p className="text-2xl font-display font-extrabold text-cyan-400">{coverage}%</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar aluno..."
          className="field pl-10"
        />
      </motion.div>

      {/* Lista */}
      <motion.div variants={fadeUp}>
        {error && (
          <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-red-500/20 bg-red-500/5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-surface-100/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl py-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center mb-3">
              <Scale className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium">
              {rows.length === 0 ? 'Nenhum aluno no escopo' : 'Nenhum aluno encontrado'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {rows.length === 0
                ? 'Convide alunos para começar a registrar avaliações.'
                : 'Tente outro termo de busca.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <Link
                key={r.studentId}
                href={`/alunos/${r.studentId}`}
                className="glass rounded-2xl p-4 flex items-center gap-4 hover:border-brand-500/20 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-cyan-400">
                    {r.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.assessedAt ? `Última: ${formatRelative(r.assessedAt)}` : 'Sem avaliação registrada'}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                  {r.weightKg !== null && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Scale className="w-3 h-3" />
                      {r.weightKg.toFixed(1)} kg
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
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

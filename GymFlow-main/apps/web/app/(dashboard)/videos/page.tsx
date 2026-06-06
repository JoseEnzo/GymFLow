'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Play, Dumbbell, X, Target, Lightbulb,
  Captions, Search, Loader2, ChevronRight, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { MUSCLE_GROUPS } from '@gymflow/database'

import { cn, MUSCLE_GROUP_COLORS } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = 'beginner' | 'intermediate' | 'advanced'

type Exercise = {
  id: string
  name_pt: string
  description: string | null
  muscle_groups: string[]
  equipment: string[]
  difficulty: Difficulty
  video_url: string | null
  instructions: string[] | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 24

const CATEGORIES = ['Todos', ...MUSCLE_GROUPS] as const

const DIFFICULTY: Record<Difficulty, { label: string; color: string }> = {
  beginner:     { label: 'Iniciante',     color: '#10B981' },
  intermediate: { label: 'Intermediário', color: '#F59E0B' },
  advanced:     { label: 'Avançado',      color: '#EF4444' },
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const fadeUp  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getColor(exercise: Exercise): string {
  for (const mg of exercise.muscle_groups) {
    if (MUSCLE_GROUP_COLORS[mg]) return MUSCLE_GROUP_COLORS[mg]
  }
  return '#6366F1'
}

function parseYouTubeEmbed(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (!match) return null
  const id = match[1]
  const base = `https://www.youtube.com/embed/${id}?cc_load_policy=1&hl=pt&cc_lang_pref=pt&rel=0&modestbranding=1`
  try {
    const orig = new URL(url)
    const t   = orig.searchParams.get('t') ?? orig.searchParams.get('start')
    const end = orig.searchParams.get('end')
    return base + (t ? `&start=${t.replace('s', '')}` : '') + (end ? `&end=${end.replace('s', '')}` : '')
  } catch {
    return base
  }
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function ExerciseModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const color    = getColor(exercise)
  const diff     = DIFFICULTY[exercise.difficulty]
  const embedUrl = exercise.video_url ? parseYouTubeEmbed(exercise.video_url) : null

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto glass rounded-2xl border border-white/10 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20` }}>
              <Dumbbell className="w-4 h-4" style={{ color }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base leading-tight">{exercise.name_pt}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${diff.color}15`, color: diff.color }}>
                  {diff.label}
                </span>
                {exercise.muscle_groups.slice(0, 3).map(mg => (
                  <span key={mg} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-200 text-muted-foreground">{mg}</span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {exercise.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{exercise.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {exercise.muscle_groups.length > 0 && (
              <div className="glass rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-brand-400" /> Músculos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.muscle_groups.map(m => (
                    <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {exercise.equipment.length > 0 && (
              <div className="glass rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-amber-400" /> Equipamentos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.equipment.map(eq => (
                    <span key={eq} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="glass rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Execução passo a passo
              </p>
              <ul className="space-y-1.5">
                {exercise.instructions.map((step, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                    <span className="text-brand-400 font-bold flex-shrink-0 mt-0.5 w-4">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vídeo */}
          <div className="space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-brand-400" /> Demonstração
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-normal ml-1">
                <Captions className="w-3 h-3" /> Legendas ativas
              </span>
            </p>

            {embedUrl ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/8">
                <iframe
                  src={embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  title={exercise.name_pt}
                />
              </div>
            ) : (
              <div className="relative aspect-video rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-3"
                style={{ background: `${color}08` }}>
                <Dumbbell className="w-10 h-10 opacity-20" style={{ color }} />
                <p className="text-xs text-muted-foreground text-center px-4">
                  Demonstração em breve
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="flex gap-2 mt-2">
          <div className="h-3 bg-white/5 rounded w-16" />
          <div className="h-3 bg-white/5 rounded w-12" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VideosPage() {
  const { currentAcademy } = useAuthStore()
  // Extrair o ID primitivo evita que o objeto currentAcademy (referência nova a cada
  // render do Zustand) quebre o useCallback do buildQuery e cause loop infinito.
  const academyId = currentAcademy?.id ?? null
  const supabase  = useMemo(() => createClient(), [])

  const [exercises, setExercises]     = useState<Exercise[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(false)
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(0)
  const [search, setSearch]           = useState('')
  const [activeCategory, setCategory] = useState<string>('Todos')
  const [selected, setSelected]       = useState<Exercise | null>(null)

  // debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleSearch(v: string) {
    setSearch(v)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(v), 300)
  }

  const buildQuery = useCallback((includeCount: boolean) => {
    let q = supabase
      .from('exercises')
      .select(
        'id, name_pt, description, muscle_groups, equipment, difficulty, video_url, instructions',
        includeCount ? { count: 'exact' } : undefined
      )
      .order('name_pt')

    if (academyId) {
      q = q.or(`is_global.eq.true,academy_id.eq.${academyId}`)
    } else {
      q = q.eq('is_global', true)
    }

    if (debouncedSearch.trim()) {
      q = q.ilike('name_pt', `%${debouncedSearch.trim()}%`)
    }

    if (activeCategory !== 'Todos') {
      q = q.contains('muscle_groups', [activeCategory])
    }

    return q
  }, [supabase, academyId, debouncedSearch, activeCategory])

  // reset + fetch first page whenever filters change
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setPage(0)

    async function load() {
      const { data, count, error } = await buildQuery(true)
        .range(0, PAGE_SIZE) // sentinel: request PAGE_SIZE+1

      if (cancelled) return
      if (error) { toast.error('Erro ao carregar exercícios'); setLoading(false); return }

      const items = (data ?? []) as Exercise[]
      const visible = items.length > PAGE_SIZE ? items.slice(0, PAGE_SIZE) : items
      setExercises(visible)
      setTotal(count ?? 0)
      setHasMore(items.length > PAGE_SIZE)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [buildQuery])

  async function loadMore() {
    const next = page + 1
    setPage(next)
    setLoadingMore(true)

    const { data, error } = await buildQuery(false)
      .range(next * PAGE_SIZE, (next + 1) * PAGE_SIZE) // sentinel

    if (error) { toast.error('Erro ao carregar mais'); setLoadingMore(false); return }

    const items = (data ?? []) as Exercise[]
    const visible = items.length > PAGE_SIZE ? items.slice(0, PAGE_SIZE) : items
    setExercises(prev => [...prev, ...visible])
    setHasMore(items.length > PAGE_SIZE)
    setLoadingMore(false)
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      <AnimatePresence>
        {selected && (
          <ExerciseModal key={selected.id} exercise={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-brand-400" />
            Biblioteca de Exercícios
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Carregando...' : `${total.toLocaleString('pt-BR')} exercícios disponíveis`}
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 glass rounded-xl text-sm border border-white/8 focus:outline-none focus:border-brand-500/40 placeholder:text-muted-foreground/40 transition-colors bg-transparent"
        />
      </motion.div>

      {/* Categories */}
      <motion.div variants={fadeUp}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={cn(
              'text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all border whitespace-nowrap flex-shrink-0',
              activeCategory === cat
                ? 'bg-brand-500/20 text-brand-400 border-brand-500/30'
                : 'bg-surface-100 text-muted-foreground border-surface-200 hover:border-brand-500/20 hover:text-foreground'
            )}>
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : exercises.length === 0 ? (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-10 text-center">
          <Video className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum exercício encontrado.</p>
        </motion.div>
      ) : (
        <>
          <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {exercises.map(ex => {
              const color = getColor(ex)
              const diff  = DIFFICULTY[ex.difficulty]
              return (
                <motion.div key={ex.id} variants={fadeUp}
                  onClick={() => setSelected(ex)}
                  className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-brand-500/20 transition-all duration-300">

                  {/* Thumbnail */}
                  <div className="relative aspect-video flex items-center justify-center overflow-hidden"
                    style={{ background: `${color}12` }}>
                    <Dumbbell className="w-12 h-12 transition-transform duration-300 group-hover:scale-110"
                      style={{ color, opacity: 0.4 }} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {ex.video_url && (
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-brand-500/80 text-white flex items-center gap-1">
                        <Play className="w-2 h-2 fill-white" /> Vídeo
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-snug line-clamp-2">{ex.name_pt}</p>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 mt-0.5 group-hover:text-brand-400 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${diff.color}15`, color: diff.color }}>
                        {diff.label}
                      </span>
                      {ex.muscle_groups.slice(0, 2).map(mg => (
                        <span key={mg} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-200 text-muted-foreground">
                          {mg}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button onClick={loadMore} disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 glass rounded-xl text-sm font-semibold border border-white/8 hover:border-brand-500/30 hover:text-brand-400 transition-all disabled:opacity-50">
                {loadingMore
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</>
                  : <><ChevronDown className="w-4 h-4" /> Carregar mais</>}
              </button>
            </div>
          )}
        </>
      )}

    </motion.div>
  )
}

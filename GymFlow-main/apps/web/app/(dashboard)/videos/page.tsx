'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Video, Lock, Play, Clock, Dumbbell, Zap, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }

const CATEGORIES = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio']

const VIDEOS = [
  { id: 1, title: 'Supino Reto com Barra', category: 'Peito',   duration: '4:32', level: 'Intermediário', color: '#6366F1', views: 1240 },
  { id: 2, title: 'Agachamento Livre',     category: 'Pernas',  duration: '6:14', level: 'Avançado',      color: '#10B981', views: 2100 },
  { id: 3, title: 'Remada Curvada',        category: 'Costas',  duration: '3:48', level: 'Intermediário', color: '#06B6D4', views: 870  },
  { id: 4, title: 'Desenvolvimento Arnold', category: 'Ombros', duration: '5:02', level: 'Intermediário', color: '#F59E0B', views: 650  },
  { id: 5, title: 'Rosca Direta',          category: 'Braços',  duration: '3:15', level: 'Iniciante',     color: '#8B5CF6', views: 1580 },
  { id: 6, title: 'Prancha Abdominal',     category: 'Core',    duration: '2:40', level: 'Iniciante',     color: '#EF4444', views: 3200 },
  { id: 7, title: 'Levantamento Terra',    category: 'Costas',  duration: '7:20', level: 'Avançado',      color: '#10B981', views: 1900 },
  { id: 8, title: 'Leg Press 45°',         category: 'Pernas',  duration: '4:05', level: 'Iniciante',     color: '#06B6D4', views: 1100 },
  { id: 9, title: 'Tríceps Corda',         category: 'Braços',  duration: '3:30', level: 'Iniciante',     color: '#F97316', views: 760  },
  { id: 10, title: 'Elevação Lateral',     category: 'Ombros',  duration: '3:55', level: 'Iniciante',     color: '#F59E0B', views: 990  },
  { id: 11, title: 'HIIT 20 Minutos',      category: 'Cardio',  duration: '20:00',level: 'Intermediário', color: '#EF4444', views: 4500 },
  { id: 12, title: 'Flexão de Braço',      category: 'Peito',   duration: '4:10', level: 'Iniciante',     color: '#6366F1', views: 2800 },
]

const LEVEL_COLORS: Record<string, string> = {
  'Iniciante':     '#10B981',
  'Intermediário': '#F59E0B',
  'Avançado':      '#EF4444',
}

export default function VideosPage() {
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const supabase = createClient()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).auth.getUser().then(({ data: { user } }: { data: { user: { user_metadata?: { subscription_plan?: string } } | null } }) => {
      setPlan(user?.user_metadata?.subscription_plan ?? null)
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isElite = plan === 'elite'

  const filtered = activeCategory === 'Todos'
    ? VIDEOS
    : VIDEOS.filter(v => v.category === activeCategory)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-xl bg-surface-200 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-surface-200 animate-pulse aspect-video" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-brand-400" />
            Biblioteca de Vídeos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vídeos de execução para seus treinos
          </p>
        </div>
        {isElite && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Star className="w-3 h-3" /> Plano Elite — Acesso completo
          </span>
        )}
      </motion.div>

      {/* Paywall para não-Elite */}
      {!isElite && (
        <motion.div variants={fadeUp} className="glass rounded-2xl p-8 text-center border border-amber-500/20 bg-amber-500/5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
          <p className="font-display font-bold text-lg">Disponível no Plano Elite</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Acesse vídeos de execução de todos os exercícios com o Plano Elite.
          </p>
          <Link href="/onboarding?plan=elite"
            className="inline-flex items-center gap-2 mt-5 btn-primary text-sm py-2.5 px-6 rounded-xl">
            <Zap className="w-4 h-4" /> Fazer upgrade para Elite
          </Link>

          {/* Teaser bloqueado */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 text-left">
            {VIDEOS.slice(0, 8).map(video => (
              <div key={video.id} className="relative rounded-2xl overflow-hidden">
                <div className="aspect-video flex items-center justify-center"
                  style={{ background: `${video.color}15` }}>
                  <Dumbbell className="w-8 h-8" style={{ color: video.color, opacity: 0.3 }} />
                </div>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                  <Lock className="w-5 h-5 text-white/50" />
                </div>
                <div className="p-3 bg-surface-100">
                  <div className="h-2.5 w-3/4 rounded bg-surface-200" />
                  <div className="h-2 w-1/2 rounded bg-surface-200 mt-1.5" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Conteúdo Elite */}
      {isElite && (
        <>
          {/* Categorias */}
          <motion.div variants={fadeUp} className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all border',
                  activeCategory === cat
                    ? 'bg-brand-500/20 text-brand-400 border-brand-500/30'
                    : 'bg-surface-100 text-muted-foreground border-surface-200 hover:border-brand-500/20 hover:text-foreground'
                )}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Grid de vídeos */}
          <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(video => (
              <motion.div key={video.id} variants={fadeUp}
                className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-brand-500/20 transition-all duration-300">
                {/* Thumbnail */}
                <div className="relative aspect-video flex items-center justify-center overflow-hidden"
                  style={{ background: `${video.color}12` }}>
                  <Dumbbell className="w-12 h-12 transition-transform duration-300 group-hover:scale-110"
                    style={{ color: video.color, opacity: 0.4 }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/50 text-white/90 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />{video.duration}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-snug">{video.title}</p>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 mt-0.5 group-hover:text-brand-400 transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${LEVEL_COLORS[video.level]}15`, color: LEVEL_COLORS[video.level] }}>
                      {video.level}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-200 text-muted-foreground">
                      {video.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {video.views.toLocaleString('pt-BR')} views
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <motion.div variants={fadeUp} className="glass rounded-2xl p-10 text-center">
              <Video className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum vídeo nesta categoria ainda.</p>
            </motion.div>
          )}
        </>
      )}

    </motion.div>
  )
}

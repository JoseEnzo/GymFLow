'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Users, Dumbbell, MapPin, Search, Building2 } from 'lucide-react'

import { BrandLogo } from '@/components/layout/brand-logo'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export type PublicAcademy = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  logo_url: string | null
  student_count: number
  personal_count: number
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

export default function AcademiasPage() {
  const [academies, setAcademies] = useState<PublicAcademy[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const supabase = createClient()
    let alive = true
    ;(async () => {
      // RPC ainda não está no types.ts gerado (aplicar migration 075 + `pnpm db:types`).
      const { data, error } = await (supabase as unknown as {
        rpc: (fn: string) => Promise<{ data: PublicAcademy[] | null; error: unknown }>
      }).rpc('get_public_academies')
      if (!alive) return
      if (!error && data) setAcademies(data)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  const filtered = academies.filter((a) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      a.name.toLowerCase().includes(q) ||
      (a.city ?? '').toLowerCase().includes(q) ||
      (a.state ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="relative min-h-screen bg-background bg-mesh">
      {/* Header simples */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo size="lg" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Início
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {/* título */}
        <div className="mb-10 space-y-4 text-center">
          <span className="badge-primary text-xs uppercase tracking-widest">Diretório</span>
          <h1 className="text-3xl font-display font-extrabold lg:text-5xl">
            Academias cadastradas
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Encontre uma academia que usa o MeuTrein e peça um convite para entrar como aluno.
          </p>
        </div>

        {/* busca */}
        <div className="mx-auto mb-10 max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou cidade…"
              className="w-full rounded-xl border border-border/60 bg-card/60 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-brand-500/50"
            />
          </div>
        </div>

        {/* conteúdo */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-card/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-border/50 bg-card/40 p-10 text-center">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" />
            <p className="font-semibold">Nenhuma academia encontrada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {query ? 'Tente outro termo de busca.' : 'Ainda não há academias cadastradas.'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((a) => (
              <motion.div key={a.id} variants={fadeUp}>
                <Link
                  href={`/academias/${a.slug}`}
                  className={cn(
                    'group flex h-full flex-col rounded-2xl border border-border/50 bg-card/60 p-6',
                    'transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-card-hover'
                  )}
                >
                  <div className="mb-4 flex items-center gap-3">
                    {a.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.logo_url}
                        alt={a.name}
                        className="h-12 w-12 rounded-xl border border-border/50 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-display font-bold leading-snug">{a.name}</h3>
                      {(a.city || a.state) && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[a.city, a.state].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-4 border-t border-border/40 pt-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4 text-brand-400" />
                      <strong className="text-foreground">{a.student_count}</strong> alunos
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Dumbbell className="h-4 w-4 text-cyan-400" />
                      <strong className="text-foreground">{a.personal_count}</strong> personais
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  )
}

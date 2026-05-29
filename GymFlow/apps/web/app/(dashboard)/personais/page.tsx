'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell, Loader2, Users,
  MoreVertical, ShieldOff, CalendarDays,
  RefreshCw, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn, formatRelativeDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

// ── Types ───────────────────────────────────────────────────
interface Personal {
  memberId: string
  userId: string
  fullName: string | null
  joinedAt: string | null
  isActive: boolean
}

// ── Helpers ─────────────────────────────────────────────────
function getInitials(name: string | null) {
  if (!name) return 'P'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#EC4899']
function avatarColor(name: string | null) {
  return COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length]!
}

// ── Card de personal ─────────────────────────────────────────
function PersonalCard({
  personal,
  onDeactivate,
}: {
  personal: Personal
  onDeactivate: (memberId: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const supabase = createClient()
  const color = avatarColor(personal.fullName)

  async function handleDeactivate() {
    setDeactivating(true)
    setMenuOpen(false)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('academy_members')
        .update({ is_active: false })
        .eq('id', personal.memberId)

      if (error) throw error
      toast.success(`${personal.fullName ?? 'Personal'} foi removido.`)
      onDeactivate(personal.memberId)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao remover personal.')
      setDeactivating(false)
    }
  }

  return (
    <motion.div variants={fadeUp}>
      <div className={cn(
        'glass rounded-2xl p-4 border transition-all duration-300',
        personal.isActive ? 'border-border/40' : 'border-border/20 opacity-60'
      )}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
            >
              {getInitials(personal.fullName)}
            </div>
            {personal.isActive && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-50" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{personal.fullName ?? 'Personal'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {personal.isActive ? (
                <span className="badge text-[10px] py-0.5 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Ativo</span>
              ) : (
                <span className="badge text-[10px] py-0.5 px-1.5 bg-surface-200 text-muted-foreground border-0">Inativo</span>
              )}
              {personal.joinedAt && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Entrou {formatRelativeDate(personal.joinedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Menu */}
          {personal.isActive && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all"
              >
                {deactivating
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <MoreVertical className="w-4 h-4" />
                }
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setMenuOpen(false)}
                      className="fixed inset-0 z-10"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 z-20 glass rounded-xl border border-border/60 shadow-lg overflow-hidden min-w-[160px]"
                    >
                      <button
                        onClick={handleDeactivate}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <ShieldOff className="w-4 h-4" />
                        Remover da academia
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function PersonaisPage() {
  const { currentAcademy, currentRole } = useAuthStore()
  const supabase = createClient()

  const [personais, setPersonais] = useState<Personal[]>([])
  const [loading, setLoading] = useState(true)

  const isOwner = currentRole === 'owner'

  const load = useCallback(async () => {
    if (!currentAcademy) { setLoading(false); return }
    setLoading(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabase as any)
      .from('academy_members')
      .select('id, user_id, joined_at, is_active, profile:profiles(full_name)')
      .eq('academy_id', currentAcademy.id)
      .eq('role', 'personal')
      .order('joined_at', { ascending: false })

    setPersonais(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (members ?? []).map((m: any) => ({
        memberId: m.id,
        userId: m.user_id,
        fullName: m.profile?.full_name ?? null,
        joinedAt: m.joined_at ?? null,
        isActive: m.is_active,
      }))
    )

    setLoading(false)
  }, [currentAcademy])

  useEffect(() => { load() }, [load])

  function handleDeactivate(memberId: string) {
    setPersonais((prev) =>
      prev.map((p) => p.memberId === memberId ? { ...p, isActive: false } : p)
    )
  }

  const activePersonais = personais.filter((p) => p.isActive)
  const inactivePersonais = personais.filter((p) => !p.isActive)

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-200 flex items-center justify-center mb-4">
          <ShieldOff className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="font-semibold text-muted-foreground">Acesso restrito</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Somente o proprietário pode gerenciar personais.</p>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Personais</h2>
          <p className="section-subtitle mt-1">
            {loading
              ? 'Carregando...'
              : `${activePersonais.length} personal${activePersonais.length !== 1 ? 'is' : ''} ativo${activePersonais.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {currentAcademy && (
          <button
            onClick={() => load()}
            className="p-2.5 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-surface-200 transition-all self-start sm:self-auto"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      )}

      {!loading && (
        <div className="space-y-6">

          {/* Personais ativos */}
          <motion.div variants={fadeUp} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Personais ativos
                <span className="badge text-[10px] py-0.5 px-1.5 bg-surface-200 border-0 font-bold">{activePersonais.length}</span>
              </p>
            </div>

            {activePersonais.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border border-dashed border-border/40">
                <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-3">
                  <Dumbbell className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Nenhum personal ainda</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Convites de personal podem ser gerados nas configurações da academia.
                </p>
              </div>
            ) : (
              <motion.div variants={stagger} className="space-y-2">
                {activePersonais.map((p) => (
                  <PersonalCard key={p.memberId} personal={p} onDeactivate={handleDeactivate} />
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Personais inativos */}
          {inactivePersonais.length > 0 && (
            <motion.div variants={fadeUp} className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <ShieldOff className="w-3.5 h-3.5" />
                Inativos
                <span className="badge text-[10px] py-0.5 px-1.5 bg-surface-200 border-0 font-bold">{inactivePersonais.length}</span>
              </p>
              <div className="space-y-2">
                {inactivePersonais.map((p) => (
                  <PersonalCard key={p.memberId} personal={p} onDeactivate={handleDeactivate} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Hierarquia */}
          <motion.div variants={fadeUp}>
            <div className="glass rounded-xl p-4 border border-border/30 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Hierarquia
              </p>
              {[
                { label: 'Proprietário', desc: 'Gerencia academia, personais e plano', color: '#10B981' },
                { label: 'Personal Trainer', desc: 'Cria fichas e convida alunos', color: '#06B6D4' },
                { label: 'Aluno', desc: 'Executa treinos e acompanha evolução', color: '#6366F1' },
              ].map(({ label, desc, color }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                  <div>
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      )}
    </motion.div>
  )
}

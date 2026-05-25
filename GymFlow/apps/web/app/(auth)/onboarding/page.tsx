'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, ArrowRight, Check, Loader2, Building2, Users } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
}

const GOALS = [
  { id: 'Hipertrofia', label: 'Hipertrofia', desc: 'Ganhar massa muscular', emoji: '💪' },
  { id: 'Perda de peso', label: 'Perda de peso', desc: 'Emagrecer com saúde', emoji: '🔥' },
  { id: 'Força', label: 'Força', desc: 'Aumentar força máxima', emoji: '🏋️' },
  { id: 'Saúde geral', label: 'Saúde geral', desc: 'Bem-estar e qualidade de vida', emoji: '❤️' },
  { id: 'Condicionamento', label: 'Condicionamento', desc: 'Resistência e cardio', emoji: '🏃' },
]

const LEVELS = [
  { id: 'Iniciante', label: 'Iniciante', desc: 'Menos de 1 ano treinando' },
  { id: 'Intermediário', label: 'Intermediário', desc: '1 a 3 anos treinando' },
  { id: 'Avançado', label: 'Avançado', desc: 'Mais de 3 anos treinando' },
]

function OnboardingContent() {
  const router = useRouter()
  const params = useSearchParams()
  const accountType = (params.get('type') ?? 'student') as 'owner' | 'student'
  const { profile } = useAuthStore()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Student state
  const [goal, setGoal] = useState('')
  const [level, setLevel] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')

  // Owner state
  const [academyName, setAcademyName] = useState('')

  const totalSteps = accountType === 'student' ? 2 : 1

  async function saveStudent() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any).upsert({
        id: user.id,
        goal,
        bio: level,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        updated_at: new Date().toISOString(),
      })

      router.push('/dashboard')
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function saveOwner() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const slug = academyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('academies') as any).insert({
        owner_id: user.id,
        name: academyName,
        slug: `${slug}-${Date.now().toString(36)}`,
        plan: 'free',
      })

      if (error) throw error

      // Reload academies
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: members } = await (supabase as any)
        .from('academy_members')
        .select('*, academy:academies(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (members) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const academies = (members as any[])
          .filter((m) => m.academy)
          .map((m) => ({ academy: m.academy, role: m.role }))
        useAuthStore.getState().setAcademies(academies)
      }

      router.push('/dashboard')
    } catch {
      toast.error('Erro ao criar academia. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function handleSkip() {
    router.push('/dashboard')
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'você'

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="relative flex items-center justify-center w-8 h-8">
          <div className="absolute inset-0 rounded-lg bg-brand-500 blur-sm opacity-50" />
          <div className="relative rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 p-1.5">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
        </div>
        <span className="font-display font-bold text-lg">
          Gym<span className="text-brand-400">Flow</span>
        </span>
      </div>

      <div className="w-full max-w-lg">
        {/* Progress */}
        {totalSteps > 1 && (
          <div className="flex gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-500',
                  i <= step ? 'bg-brand-500' : 'bg-surface-300'
                )}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── STUDENT STEP 0: Goal ── */}
          {accountType === 'student' && step === 0 && (
            <motion.div key="s0" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold">
                  Olá, {firstName}! 👋
                </h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Qual é o seu principal objetivo no treino?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200',
                      goal === g.id
                        ? 'border-brand-500/50 bg-brand-500/8 shadow-glow-sm'
                        : 'border-border/60 hover:border-border hover:bg-surface-100'
                    )}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{g.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                    </div>
                    {goal === g.id && (
                      <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!goal}
                className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40"
              >
                Continuar <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </motion.div>
          )}

          {/* ── STUDENT STEP 1: Physical data ── */}
          {accountType === 'student' && step === 1 && (
            <motion.div key="s1" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold">Suas características</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Essas informações ajudam a personalizar seus treinos e acompanhar sua evolução.
                </p>
              </div>

              {/* Physical */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Peso atual (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="Ex: 75"
                    className="field"
                    min="30"
                    max="300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Altura (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="Ex: 175"
                    className="field"
                    min="100"
                    max="250"
                  />
                </div>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nível de experiência</label>
                <div className="grid grid-cols-1 gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={cn(
                        'flex items-center justify-between p-3.5 rounded-xl border text-left transition-all',
                        level === l.id
                          ? 'border-brand-500/50 bg-brand-500/8'
                          : 'border-border/60 hover:border-border hover:bg-surface-100'
                      )}
                    >
                      <div>
                        <p className="font-semibold text-sm">{l.label}</p>
                        <p className="text-xs text-muted-foreground">{l.desc}</p>
                      </div>
                      {level === l.id && (
                        <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 btn-secondary py-3.5 rounded-xl font-semibold text-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={saveStudent}
                  disabled={saving}
                  className="flex-2 flex-1 btn-primary py-3.5 rounded-xl font-semibold text-sm"
                >
                  {saving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : 'Começar agora →'
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* ── OWNER STEP 0: Academy setup ── */}
          {accountType === 'owner' && step === 0 && (
            <motion.div key="o0" variants={fadeUp} initial="hidden" animate="show" exit="exit" className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold">
                  Vamos configurar sua academia 🏢
                </h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Você pode alterar essas informações depois nas configurações.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nome da academia</label>
                  <input
                    type="text"
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    placeholder="Ex: Academia Força Total"
                    className="field"
                  />
                </div>

                <div className="glass rounded-2xl p-4 flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Convide seus alunos depois</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Após criar sua academia você receberá um link e código de convite para compartilhar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 btn-secondary py-3.5 rounded-xl font-semibold text-sm"
                >
                  Pular por enquanto
                </button>
                <button
                  onClick={saveOwner}
                  disabled={saving || !academyName.trim()}
                  className="flex-1 btn-primary py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40"
                >
                  {saving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : 'Criar academia →'
                  }
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <button onClick={handleSkip} className="hover:text-foreground transition-colors underline underline-offset-2">
            Pular e configurar depois
          </button>
        </p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OnboardingContent />
    </Suspense>
  )
}

'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
}

function CodigoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isLoggedIn = searchParams.get('from') === 'dashboard'

  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [showBackConfirm, setShowBackConfirm] = useState(false)

  // Convites antigos têm código de 6 caracteres; novos têm 8.
  const isValidLength = code.length === 6 || code.length === 8

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6 && trimmed.length !== 8) return

    setStatus('loading')
    setError(null)

    try {
      // Lookup via API (service role) — RLS não permite mais ler invites
      // pelo client (migration 069).
      const res = await fetch(`/api/invites/lookup?code=${encodeURIComponent(trimmed)}`)
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { error?: string } | null
        setError(err?.error ?? 'Código inválido ou expirado. Verifique e tente novamente.')
        setStatus('error')
        return
      }

      const data = await res.json() as { token: string }
      router.push(`/convite/${data.token}`)
    } catch {
      setError('Erro ao verificar código. Tente novamente.')
      setStatus('error')
    }
  }

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      {showBackConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm bg-surface-100 rounded-2xl p-5 space-y-4 border border-border/40"
          >
            <p className="text-sm text-center leading-relaxed">
              Se você voltar o seu convite não estará sendo utilizado. Deseja mesmo fazer isso?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowBackConfirm(false)}
                className="btn-secondary py-2.5 rounded-xl text-sm font-semibold"
              >
                Ficar
              </button>
              <button
                onClick={() => router.back()}
                className="py-2.5 rounded-xl text-sm font-semibold bg-destructive/15 text-red-400 hover:bg-destructive/25 transition-colors"
              >
                Sair assim mesmo
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <motion.div variants={fadeUp} custom={0} className="space-y-1.5">
        <button
          onClick={() => setShowBackConfirm(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
        <h1 className="text-2xl font-display font-bold">Entrar com código</h1>
        <p className="text-sm text-muted-foreground">
          Digite o código recebido da sua academia
        </p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div variants={fadeUp} custom={1} className="space-y-2">
          <label className="text-sm font-medium">Código do convite</label>
          <input
            type="text"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))
            }
            placeholder="ABC12345"
            maxLength={8}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className={cn(
              'field text-center font-mono text-2xl tracking-[0.4em] uppercase py-5',
              status === 'error' && 'border-destructive/60'
            )}
          />
          <p className="text-xs text-muted-foreground text-center">
            {code.length}/8 caracteres
          </p>
        </motion.div>

        <motion.div variants={fadeUp} custom={2}>
          <button
            type="submit"
            disabled={!isValidLength || status === 'loading'}
            className={cn(
              'w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2',
              (!isValidLength || status === 'loading') && 'opacity-60 cursor-not-allowed'
            )}
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Continuar <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </motion.div>
      </form>

      {!isLoggedIn && (
        <motion.p variants={fadeUp} custom={3} className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Fazer login
          </Link>
        </motion.p>
      )}
    </motion.div>
  )
}

export default function CodigoPage() {
  return (
    <Suspense fallback={null}>
      <CodigoContent />
    </Suspense>
  )
}

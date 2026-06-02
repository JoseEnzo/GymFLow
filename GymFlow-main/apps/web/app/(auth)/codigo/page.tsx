'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()

  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) return

    setStatus('loading')
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('invites')
        .select('token')
        .eq('code', trimmed)
        .eq('is_active', true)
        .single()

      if (queryError || !data) {
        setError('Código inválido ou expirado. Verifique e tente novamente.')
        setStatus('error')
        return
      }

      router.push(`/convite/${(data as { token: string }).token}`)
    } catch {
      setError('Erro ao verificar código. Tente novamente.')
      setStatus('error')
    }
  }

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} custom={0} className="space-y-1.5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
        <h1 className="text-2xl font-display font-bold">Entrar com código</h1>
        <p className="text-sm text-muted-foreground">
          Digite o código de 6 caracteres recebido da sua academia
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
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
            }
            placeholder="ABC123"
            maxLength={6}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className={cn(
              'field text-center font-mono text-3xl tracking-[0.6em] uppercase py-5',
              status === 'error' && 'border-destructive/60'
            )}
          />
          <p className="text-xs text-muted-foreground text-center">
            {code.length}/6 caracteres
          </p>
        </motion.div>

        <motion.div variants={fadeUp} custom={2}>
          <button
            type="submit"
            disabled={code.length !== 6 || status === 'loading'}
            className={cn(
              'w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2',
              (code.length !== 6 || status === 'loading') && 'opacity-60 cursor-not-allowed'
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

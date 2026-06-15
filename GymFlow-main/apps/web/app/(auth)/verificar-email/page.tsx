'use client'

import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, MailCheck, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain || !user) return email
  const head = user.slice(0, 2)
  return `${head}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`
}

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const next = searchParams.get('next') || '/onboarding'

  const reset = useAuthStore((s) => s.reset)
  const [email, setEmail] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const sentRef = useRef(false)

  // Sessão + envio inicial do código (1x). Já verificado → segue pro destino.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setEmail(data.user.email ?? null)
      if (sentRef.current) return
      sentRef.current = true
      await sendCode(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Contagem regressiva do cooldown de reenvio.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function goHome() {
    await supabase.auth.signOut()
    reset()
    router.replace('/')
  }

  async function sendCode(silent = false) {
    try {
      const res = await fetch('/api/auth/send-verification', { method: 'POST' })
      const json = await res.json().catch(() => null)
      if (json?.alreadyVerified) { router.replace(next); return }
      if (res.status === 429) {
        setCooldown(json?.retryAfter ?? 30)
        if (!silent) toast.error(json?.error ?? 'Aguarde antes de reenviar.')
        return
      }
      if (!res.ok) { toast.error(json?.error ?? 'Erro ao enviar o código.'); return }
      setCooldown(30)
      if (!silent) toast.success('Código reenviado!')
    } catch {
      toast.error('Erro de conexão ao enviar o código.')
    }
  }

  async function verify() {
    if (code.length !== 6) return
    setVerifying(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(json?.error ?? 'Código inválido.')
        setCode('')
        return
      }
      toast.success('E-mail confirmado!')
      router.replace(next)
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-brand-500/15">
          <MailCheck className="w-7 h-7 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Confirme seu e-mail</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Enviamos um código de 6 dígitos para
            <br />
            <span className="text-foreground font-medium">{email ? maskEmail(email) : '...'}</span>
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Código de verificação</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          autoFocus
          className="field text-center tracking-[0.5em] font-mono text-xl"
          onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && verify()}
        />
      </div>

      <button
        onClick={verify}
        disabled={verifying || code.length !== 6}
        className="w-full btn-primary py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar e-mail'}
      </button>

      <div className="text-center">
        <button
          onClick={() => sendCode(false)}
          disabled={cooldown > 0}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Não recebeu? Reenviar código'}
        </button>
      </div>

      <div className="border-t border-border pt-4 text-center">
        <button
          onClick={goHome}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para o início
        </button>
      </div>
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  )
}

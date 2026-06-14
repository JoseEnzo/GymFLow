'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, Users, Dumbbell, MapPin, Building2, Send, CheckCircle2, Loader2,
} from 'lucide-react'

import { BrandLogo } from '@/components/layout/brand-logo'
import { Turnstile, type TurnstileRef } from '@/components/ui/turnstile'
import { createClient } from '@/lib/supabase/client'
import type { PublicAcademy } from '../page'

export default function AcademyDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const [academy, setAcademy] = useState<PublicAcademy | null>(null)
  const [loading, setLoading] = useState(true)

  // form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileRef>(null)

  useEffect(() => {
    if (!slug) return
    const supabase = createClient()
    let alive = true
    ;(async () => {
      // RPC ainda não está no types.ts gerado (aplicar migration 075 + `pnpm db:types`).
      const { data } = await (supabase as unknown as {
        rpc: (fn: string) => Promise<{ data: PublicAcademy[] | null; error: unknown }>
      }).rpc('get_public_academies')
      if (!alive) return
      setAcademy((data ?? []).find((a) => a.slug === slug) ?? null)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() && !phone.trim()) {
      setError('Informe um e-mail ou telefone/WhatsApp para a academia te contatar.')
      return
    }

    setSubmitting(true)
    try {
      const token = await turnstileRef.current?.getToken()
      if (token === null) {
        setError('Verificação anti-bot falhou. Recarregue a página e tente de novo.')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/academias/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academyId: academy?.id,
          name,
          email,
          phone,
          message,
          turnstileToken: token ?? '',
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Não foi possível enviar. Tente novamente.')
        turnstileRef.current?.reset()
        setSubmitting(false)
        return
      }

      setSent(true)
    } catch {
      setError('Falha de conexão. Tente novamente.')
      turnstileRef.current?.reset()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background bg-mesh">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo size="lg" />
          <Link
            href="/academias"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Academias
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {loading ? (
          <div className="space-y-6">
            <div className="h-28 animate-pulse rounded-2xl bg-card/50" />
            <div className="h-64 animate-pulse rounded-2xl bg-card/50" />
          </div>
        ) : !academy ? (
          <div className="mx-auto max-w-md rounded-2xl border border-border/50 bg-card/40 p-10 text-center">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" />
            <p className="font-semibold">Academia não encontrada</p>
            <Link href="/academias" className="mt-4 inline-block text-sm font-semibold text-brand-400 hover:text-brand-300">
              Ver todas as academias →
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* cabeçalho da academia */}
            <div className="rounded-2xl border border-border/50 bg-card/60 p-7">
              <div className="flex items-center gap-4">
                {academy.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={academy.logo_url}
                    alt={academy.name}
                    className="h-16 w-16 rounded-2xl border border-border/50 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400">
                    <Dumbbell className="h-7 w-7" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-display font-extrabold lg:text-3xl">{academy.name}</h1>
                  {(academy.city || academy.state) && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {[academy.city, academy.state].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/40 bg-background/40 p-4">
                  <Users className="mb-1.5 h-5 w-5 text-brand-400" />
                  <p className="font-display text-2xl font-bold">{academy.student_count}</p>
                  <p className="text-xs text-muted-foreground">alunos cadastrados</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-background/40 p-4">
                  <Dumbbell className="mb-1.5 h-5 w-5 text-cyan-400" />
                  <p className="font-display text-2xl font-bold">{academy.personal_count}</p>
                  <p className="text-xs text-muted-foreground">personais</p>
                </div>
              </div>
            </div>

            {/* pedir convite */}
            <div className="rounded-2xl border border-border/50 bg-card/60 p-7">
              <h2 className="font-display text-xl font-bold">Pedir convite para entrar</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Deixe seu contato que a academia entra em contato para te enviar um convite de aluno.
              </p>

              {sent ? (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-400">Solicitação enviada!</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A {academy.name} recebeu seu contato e vai te chamar em breve.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Seu nome</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Como a academia deve te chamar"
                      className="w-full rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500/50"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">E-mail</label>
                      <input
                        type="email"
                        inputMode="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@email.com"
                        className="w-full rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Telefone / WhatsApp</label>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500/50"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Informe pelo menos um e-mail ou telefone.</p>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Mensagem (opcional)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="Ex.: tenho interesse em treinar aí, qual o horário?"
                      className="w-full resize-none rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500/50"
                    />
                  </div>

                  <Turnstile ref={turnstileRef} />

                  {error && (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full justify-center disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar solicitação
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

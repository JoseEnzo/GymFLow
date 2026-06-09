'use client'

/**
 * Componente Cloudflare Turnstile (widget CAPTCHA invisível/managed).
 *
 * Uso:
 *   const turnstileRef = useRef<TurnstileRef>(null)
 *   const token = await turnstileRef.current?.getToken()
 *   // Enviar token para /api/turnstile para verificar
 *
 * Variável de ambiente necessária: NEXT_PUBLIC_TURNSTILE_SITE_KEY
 */
import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      getResponse: (widgetId: string) => string | undefined
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

export interface TurnstileRef {
  /** Retorna o token atual ou aguarda até estar disponível (timeout 30s) */
  getToken: () => Promise<string | null>
  /** Reseta o widget (necessário após erro de verificação) */
  reset: () => void
}

interface TurnstileProps {
  /** Chamado quando o token é gerado pelo Cloudflare */
  onToken?: (token: string) => void
  /** Chamado quando o token expira */
  onExpire?: () => void
  /**
   * 'always' (padrão) — widget visível e resolve o desafio automaticamente ao
   * renderizar, disparando o callback (token). 'interaction-only' esconde até
   * exigir interação. NÃO use 'execute': ele adia o desafio até chamar
   * window.turnstile.execute() — este componente nunca chama, então o callback
   * jamais dispara e getToken() expira em 30s (login trava sem token).
   */
  appearance?: 'always' | 'execute' | 'interaction-only'
  className?: string
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
const SCRIPT_ID = 'cf-turnstile-script'

const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  ({ onToken, onExpire, appearance = 'always', className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const tokenRef = useRef<string | null>(null)

    const render = useCallback(() => {
      if (!containerRef.current || !window.turnstile || !SITE_KEY) return

      // Remover widget anterior se existir
      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current) } catch { /* ignore */ }
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        appearance,
        callback: (token: string) => {
          tokenRef.current = token
          onToken?.(token)
        },
        'expired-callback': () => {
          tokenRef.current = null
          onExpire?.()
        },
        'error-callback': () => {
          tokenRef.current = null
        },
      })
    }, [appearance, onToken, onExpire])

    useEffect(() => {
      if (!SITE_KEY) return // Sem site key: skip (dev sem Turnstile)

      // Carregar script uma única vez
      if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement('script')
        script.id = SCRIPT_ID
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.defer = true
        script.onload = render
        document.head.appendChild(script)
      } else if (window.turnstile) {
        render()
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try { window.turnstile.remove(widgetIdRef.current) } catch { /* ignore */ }
        }
      }
    }, [render])

    useImperativeHandle(ref, () => ({
      getToken: () =>
        new Promise<string | null>((resolve) => {
          // Sem site key configurado: retorna string vazia (dev bypass)
          if (!SITE_KEY) { resolve(''); return }

          if (tokenRef.current) { resolve(tokenRef.current); return }

          // Aguardar até 30s pelo token
          const deadline = Date.now() + 30_000
          const poll = setInterval(() => {
            if (tokenRef.current) { clearInterval(poll); resolve(tokenRef.current) }
            else if (Date.now() > deadline) { clearInterval(poll); resolve(null) }
          }, 200)
        }),

      reset: () => {
        tokenRef.current = null
        if (widgetIdRef.current && window.turnstile) {
          try { window.turnstile.reset(widgetIdRef.current) } catch { /* ignore */ }
        }
      },
    }))

    if (!SITE_KEY) return null // Não renderiza nada sem site key

    return <div ref={containerRef} className={className} />
  }
)

Turnstile.displayName = 'Turnstile'
export { Turnstile }

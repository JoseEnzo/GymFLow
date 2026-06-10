'use client'

import { useState } from 'react'
import { Download, Share, Plus, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useInstallPrompt } from '@/hooks/use-install-prompt'

interface InstallButtonProps {
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function InstallButton({ className, variant = 'secondary' }: InstallButtonProps) {
  const { isIos, isStandalone, canPrompt, triggerPrompt } = useInstallPrompt()
  const [showIosSheet, setShowIosSheet] = useState(false)

  // Já instalado: não renderiza nada.
  if (isStandalone) return null

  // Chrome/Edge/Android sem evento ainda: navegador não considera instalável.
  // Mantemos o botão mesmo assim em iOS (instrução manual) ou se houver prompt.
  if (!canPrompt && !isIos) return null

  const baseClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'ghost'
        ? 'inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
        : 'btn-secondary'

  const handleClick = async () => {
    if (isIos) {
      setShowIosSheet(true)
      return
    }
    await triggerPrompt()
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={cn(baseClass, className)}>
        <Download className="w-4 h-4" />
        <span>Instalar app</span>
      </button>

      {showIosSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowIosSheet(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          <div
            className="w-full sm:max-w-md bg-surface-100 border border-border rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="ios-install-title" className="text-lg font-semibold">
                Instalar MeuTrein no iPhone
              </h2>
              <button
                type="button"
                onClick={() => setShowIosSheet(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <span className="flex items-center gap-2 flex-wrap">
                  Toque no ícone
                  <Share className="w-4 h-4 inline text-brand-400" />
                  <span>na barra do Safari</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <span className="flex items-center gap-2 flex-wrap">
                  Role e toque em
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-200 rounded">
                    <Plus className="w-3 h-3" />
                    Adicionar à Tela de Início
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <span>Confirme em &ldquo;Adicionar&rdquo; — pronto, abre como app.</span>
              </li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Só funciona no Safari. Se estiver no Chrome ou outro navegador, abra esse link no Safari primeiro.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

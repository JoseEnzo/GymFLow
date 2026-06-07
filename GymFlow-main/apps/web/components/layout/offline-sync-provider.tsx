'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CloudOff, RotateCw, WifiOff } from 'lucide-react'

import { useOnlineSync } from '@/hooks/use-online-sync'
import { cn } from '@/lib/utils'

/**
 * Provider client-side mostrando estado de conexão + treinos pendentes de sync.
 *
 * Montado no `(dashboard)/layout.tsx`. Quando offline, banner topo "Offline".
 * Quando online MAS com treinos na fila, banner amarelo "Sincronizando...".
 */
export function OfflineSyncProvider() {
  const { isOnline, pendingCount, syncing } = useOnlineSync()

  const showOffline = !isOnline
  const showPending = isOnline && pendingCount > 0

  return (
    <AnimatePresence>
      {(showOffline || showPending) && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2.5 px-4 py-2 text-xs font-medium border-b',
            showOffline
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
              : 'bg-brand-500/15 border-brand-500/30 text-brand-200',
          )}
          role="status"
          aria-live="polite"
        >
          {showOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>
                Você está offline.{' '}
                {pendingCount > 0 ? (
                  <>Seu{pendingCount > 1 ? 's' : ''} treino{pendingCount > 1 ? 's' : ''} vai sincronizar quando voltar.</>
                ) : (
                  <>O treino fica salvo localmente e sincroniza ao reconectar.</>
                )}
              </span>
            </>
          ) : syncing ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>
                Sincronizando {pendingCount} treino{pendingCount > 1 ? 's' : ''}…
              </span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5" />
              <span>
                {pendingCount} treino{pendingCount > 1 ? 's aguardam' : ' aguarda'} sincronização.
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

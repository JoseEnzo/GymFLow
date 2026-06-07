'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import {
  getPendingWorkouts,
  removePendingWorkout,
  countPendingWorkouts,
  type PendingWorkout,
} from '@/lib/offline-store'

/**
 * Detecta online/offline + drena a fila de treinos pendentes quando volta a internet.
 *
 * Idempotência garantida pela RPC `complete_workout` via `p_client_id` (migration
 * 028). Mesmo que drain rode 2x num intervalo curto, o servidor não cria
 * workout_log duplicado.
 *
 * Não tenta reenvio em loop: se a RPC falhar (ex: sessão expirada, erro de RLS),
 * o item fica na fila e tenta no próximo `online` event ou refresh manual.
 */
export function useOnlineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshCount = useCallback(async () => {
    const n = await countPendingWorkouts()
    setPendingCount(n)
  }, [])

  const drain = useCallback(async () => {
    if (syncing) return
    setSyncing(true)
    try {
      const pending = await getPendingWorkouts()
      if (pending.length === 0) {
        setSyncing(false)
        return
      }

      const supabase = createClient()
      let succeeded = 0
      let failed = 0

      for (const item of pending) {
        const ok = await syncOne(supabase, item)
        if (ok) {
          await removePendingWorkout(item.clientId)
          succeeded++
        } else {
          failed++
        }
      }

      if (succeeded > 0) {
        toast.success(
          succeeded === 1
            ? 'Treino sincronizado!'
            : `${succeeded} treinos sincronizados!`,
        )
      }
      if (failed > 0 && succeeded === 0) {
        // Só alerta erro se NADA sincronizou — evita ruído quando 1 item falha e os outros vão.
        toast.error('Não consegui sincronizar agora. Tento de novo daqui a pouco.')
      }
    } finally {
      await refreshCount()
      setSyncing(false)
    }
  }, [syncing, refreshCount])

  useEffect(() => {
    if (typeof window === 'undefined') return

    function handleOnline() {
      setIsOnline(true)
      // Pequeno delay pra rede estabilizar antes de tentar drenar.
      setTimeout(() => { drain() }, 600)
    }
    function handleOffline() { setIsOnline(false) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    refreshCount()
    // Se a página abriu já online com queue cheia (fechou o app antes do sync),
    // tenta drenar uma vez no mount.
    if (navigator.onLine) {
      setTimeout(() => { drain() }, 1500)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isOnline, pendingCount, syncing, drainNow: drain, refreshCount }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncOne(supabase: any, item: PendingWorkout): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('complete_workout', {
      p_sheet_id: item.sheetId,
      p_academy_id: item.academyId,
      p_duration_seconds: item.durationSeconds,
      p_set_logs: item.setLogs,
      p_client_id: item.clientId,
    })
    if (error) {
      // Erros "transientes" (rede/timeout): item fica na fila pra retry.
      // Erros "permanentes" (RLS violation, sheet apagada): também fica — usuário
      // verá o pending count e pode decidir limpar manualmente. Não auto-deletamos
      // pra não perder o treino do aluno em caso de bug de validação.
      console.warn('[offline-sync] falha ao sincronizar', item.clientId, error)
      return false
    }
    return true
  } catch (err) {
    console.warn('[offline-sync] exceção', item.clientId, err)
    return false
  }
}

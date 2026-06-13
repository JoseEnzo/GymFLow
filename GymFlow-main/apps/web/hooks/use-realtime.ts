'use client'

import { useEffect, useMemo, useRef } from 'react'

import { createClient } from '@/lib/supabase/client'

interface RealtimeOptions {
  /** Tabela a observar (schema public). */
  table: string
  /** Filtro postgres_changes, ex: `sheet_id=eq.${id}`. Requer REPLICA IDENTITY FULL pra casar em UPDATE/DELETE por coluna não-PK (ver migration 072). */
  filter?: string
  /** Evento observado. Default '*' (INSERT + UPDATE + DELETE). */
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  /** Liga/desliga a subscrição sem desmontar o componente (ex: esperar `id` carregar). */
  enabled?: boolean
}

/**
 * Subscreve a mudanças de uma tabela via Supabase Realtime e chama `onChange`
 * a cada evento. Use pra refazer o load da página quando outro usuário (ex: o
 * personal) altera os dados que o usuário atual está vendo.
 *
 * O callback fica numa ref: passar uma função inline NÃO re-subscreve o canal
 * a cada render. O canal só é recriado quando table/filter/event/enabled mudam.
 */
export function useRealtime(
  { table, filter, event = '*', enabled = true }: RealtimeOptions,
  onChange: () => void,
) {
  // Client estável — sem useMemo, createClient() retorna instância nova a cada
  // render e o canal seria re-subscrito em loop (mesma pegadinha do use-auth).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClient(), []) as any

  const cbRef = useRef(onChange)
  cbRef.current = onChange

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel(`rt:${table}:${filter ?? 'all'}`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table, ...(filter ? { filter } : {}) },
        () => cbRef.current(),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, table, filter, event, enabled])
}

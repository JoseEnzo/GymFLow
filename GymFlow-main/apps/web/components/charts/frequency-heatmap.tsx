'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

type Entry = { level: 0 | 1 | 2 | 3 | 4; date: string }
type DayCount = { d: string; c: number }

// Data LOCAL (não UTC) — treino às 23h local deve cair no dia local, e as
// chaves de `days` vêm do banco já em data local (RPC com `at time zone`).
const fmtLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  return 4
}

function generateData(timestamps: string[], days?: DayCount[]): Entry[] {
  const data: Entry[] = []
  const now = new Date()
  const dayCounts: Record<string, number> = {}

  if (days) {
    days.forEach(({ d, c }) => { dayCounts[d] = c })
  } else {
    timestamps.forEach(ts => {
      const dateStr = fmtLocal(new Date(ts))
      dayCounts[dateStr] = (dayCounts[dateStr] ?? 0) + 1
    })
  }

  for (let i = 364; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = fmtLocal(d)
    data.push({ level: countToLevel(dayCounts[dateStr] ?? 0), date: dateStr })
  }
  return data
}

const COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-surface-200',
  1: 'bg-brand-900/60',
  2: 'bg-brand-700/70',
  3: 'bg-brand-500/80',
  4: 'bg-brand-400',
}

export function FrequencyHeatmap({ timestamps = [], days }: { timestamps?: string[]; days?: DayCount[] }) {
  // Dado derivado puro de props → useMemo (NÃO useEffect+setState). O default
  // `timestamps = []` gera referência nova a cada render; com useEffect isso
  // causava setState → re-render → loop infinito. A key serializada garante que
  // só recalcula quando os valores realmente mudam.
  const key = days ? days.map(({ d, c }) => `${d}:${c}`).join(',') : timestamps.join(',')
  const entries = useMemo(() => {
    const data = generateData(timestamps, days)
    const firstDay = new Date(data[0]!.date).getDay()
    return { data, pad: (firstDay + 6) % 7 }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <div className="flex flex-wrap gap-[3px]" style={{ maxWidth: '100%' }}>
      {Array.from({ length: entries.pad }).map((_, i) => (
        <div key={`pad-${i}`} className="w-[10px] h-[10px] rounded-[2px] bg-transparent" />
      ))}
      {entries.data.map((d) => (
        <div
          key={d.date}
          title={d.date}
          className={cn('w-[10px] h-[10px] rounded-[2px] transition-all hover:scale-125', COLORS[d.level])}
        />
      ))}
    </div>
  )
}

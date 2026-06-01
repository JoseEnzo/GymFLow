'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Entry = { level: 0 | 1 | 2 | 3 | 4; date: string; count: number }

function seededLevel(dateStr: string): 0 | 1 | 2 | 3 | 4 {
  let h = 0
  for (let i = 0; i < dateStr.length; i++) h = (Math.imul(31, h) + dateStr.charCodeAt(i)) | 0
  const v = (((h >>> 0) % 100) + 100) % 100
  return v < 35 ? 0 : v < 55 ? 1 : v < 72 ? 2 : v < 88 ? 3 : 4
}

const MOCK_COUNT: Record<0 | 1 | 2 | 3 | 4, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 }

function levelFromCount(c: number): 0 | 1 | 2 | 3 | 4 {
  return c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : c <= 5 ? 3 : 4
}

function buildEntries(dates?: string[]): Entry[] {
  const countMap = new Map<string, number>()
  if (dates) {
    for (const d of dates) {
      const key = d.slice(0, 10)
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    }
  }

  const entries: Entry[] = []
  const now = new Date()
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    if (dates) {
      const count = countMap.get(dateStr) ?? 0
      entries.push({ level: levelFromCount(count), date: dateStr, count })
    } else {
      const level = seededLevel(dateStr)
      entries.push({ level, date: dateStr, count: MOCK_COUNT[level] })
    }
  }
  return entries
}

const COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-surface-200',
  1: 'bg-brand-900/60',
  2: 'bg-brand-700/70',
  3: 'bg-brand-500/80',
  4: 'bg-brand-400',
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function fmtCount(count: number) {
  if (count === 0) return 'Sem treinos'
  return count === 1 ? '1 treino' : `${count} treinos`
}

type TipState = { x: number; y: number; date: string; count: number }

export function FrequencyHeatmap({ dates }: { dates?: string[] }) {
  const [state, setState] = useState<{ data: Entry[]; pad: number } | null>(null)
  const [tip, setTip] = useState<TipState | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const data = buildEntries(dates)
    const pad = (new Date(data[0]!.date).getDay() + 6) % 7
    setState({ data, pad })
  }, [dates])

  if (!state) return <div className="flex flex-wrap gap-[3px] h-[10px]" />

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-wrap gap-[3px]">
        {Array.from({ length: state.pad }).map((_, i) => (
          <div key={`p${i}`} className="w-[10px] h-[10px] rounded-[2px]" />
        ))}
        {state.data.map((d) => (
          <div
            key={d.date}
            className={cn(
              'w-[10px] h-[10px] rounded-[2px] transition-all hover:scale-125 cursor-default',
              COLORS[d.level],
            )}
            onMouseEnter={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              const cr = ref.current?.getBoundingClientRect()
              if (!cr) return
              setTip({ x: r.left - cr.left + r.width / 2, y: r.top - cr.top, date: d.date, count: d.count })
            }}
            onMouseLeave={() => setTip(null)}
          />
        ))}
      </div>

      {tip && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{ left: tip.x, top: tip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-surface-100 border border-surface-200 rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
            <p className="text-[11px] font-semibold capitalize">{fmtDate(tip.date)}</p>
            <p className="text-[10px] text-muted-foreground">{fmtCount(tip.count)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

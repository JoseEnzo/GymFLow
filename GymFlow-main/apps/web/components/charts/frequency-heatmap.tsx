'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Entry = { level: 0 | 1 | 2 | 3 | 4; date: string }

function seededLevel(dateStr: string): 0 | 1 | 2 | 3 | 4 {
  let h = 0
  for (let i = 0; i < dateStr.length; i++) h = (Math.imul(31, h) + dateStr.charCodeAt(i)) | 0
  const v = (((h >>> 0) % 100) + 100) % 100
  return v < 35 ? 0 : v < 55 ? 1 : v < 72 ? 2 : v < 88 ? 3 : 4
}

function generateData(): Entry[] {
  const data: Entry[] = []
  const now = new Date()
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    data.push({ level: seededLevel(dateStr), date: dateStr })
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

export function FrequencyHeatmap() {
  const [entries, setEntries] = useState<{ data: Entry[]; pad: number } | null>(null)

  useEffect(() => {
    const data = generateData()
    const firstDay = new Date(data[0]!.date).getDay()
    setEntries({ data, pad: (firstDay + 6) % 7 })
  }, [])

  if (!entries) {
    return <div className="flex flex-wrap gap-[3px] h-[10px]" style={{ maxWidth: '100%' }} />
  }

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

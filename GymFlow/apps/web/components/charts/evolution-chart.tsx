'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

const data = [
  { week: 'Sem 1', treinos: 3, volume: 4200 },
  { week: 'Sem 2', treinos: 4, volume: 5100 },
  { week: 'Sem 3', treinos: 2, volume: 3200 },
  { week: 'Sem 4', treinos: 5, volume: 6400 },
  { week: 'Sem 5', treinos: 4, volume: 5800 },
  { week: 'Sem 6', treinos: 5, volume: 6900 },
  { week: 'Sem 7', treinos: 3, volume: 4600 },
  { week: 'Sem 8', treinos: 6, volume: 7800 },
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="glass rounded-xl p-3 border border-border/60 shadow-xl text-xs">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">
            {entry.dataKey === 'treinos' ? 'Treinos' : 'Volume'}:
          </span>
          <span className="font-bold" style={{ color: entry.color }}>
            {entry.dataKey === 'treinos'
              ? entry.value
              : `${(entry.value / 1000).toFixed(1)}k kg`}
          </span>
        </div>
      ))}
    </div>
  )
}

export function EvolutionChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

        <XAxis
          dataKey="week"
          tick={{ fill: '#64748B', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748B', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="treinos"
          stroke="#6366F1"
          strokeWidth={2}
          fill="url(#gradPrimary)"
          dot={{ fill: '#6366F1', strokeWidth: 0, r: 3 }}
          activeDot={{ fill: '#818CF8', r: 5, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="volume"
          stroke="#06B6D4"
          strokeWidth={2}
          fill="url(#gradCyan)"
          dot={false}
          activeDot={{ fill: '#22D3EE', r: 5, strokeWidth: 0 }}
          yAxisId={1}
        />

        <YAxis yAxisId={1} orientation="right" hide />
      </AreaChart>
    </ResponsiveContainer>
  )
}

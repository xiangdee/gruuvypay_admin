'use client'

import { useState } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'

export type Period = 'daily' | 'weekly' | 'monthly'

interface VolumeDataPoint {
  date: string
  total: number
  bills: number
  crypto: number
}

interface VolumeChartProps {
  data: VolumeDataPoint[]
  loading?: boolean
  onPeriodChange?: (period: Period) => void
}

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Daily',   value: 'daily'   },
  { label: 'Weekly',  value: 'weekly'  },
  { label: 'Monthly', value: 'monthly' },
]

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `₦${(value / 1_000).toFixed(0)}K`
  return `₦${value}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-lg text-xs space-y-1.5">
      <p className="font-semibold text-foreground pb-0.5 border-b border-border">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground ml-auto pl-4">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function VolumeChart({ data, loading = false, onPeriodChange }: VolumeChartProps) {
  const [activePeriod, setActivePeriod] = useState<Period>('daily')

  function handlePeriodChange(period: Period) {
    setActivePeriod(period)
    onPeriodChange?.(period)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">Transaction Volume</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Total, bills &amp; crypto breakdown</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  activePeriod === p.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-60 w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gradBills" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gradCrypto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={64} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => <span className="capitalize text-muted-foreground">{value}</span>}
              />
              <Area type="monotone" dataKey="total"  stroke="#6366f1" fill="url(#gradTotal)"  strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="total"  />
              <Area type="monotone" dataKey="bills"  stroke="#0ea5e9" fill="url(#gradBills)"  strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="bills"  />
              <Area type="monotone" dataKey="crypto" stroke="#a855f7" fill="url(#gradCrypto)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="crypto" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

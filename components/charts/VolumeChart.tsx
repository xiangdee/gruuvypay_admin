'use client'

import React, { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`
  return `₦${value}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-md text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-medium text-foreground">{formatCurrency(entry.value)}</span>
          </div>
        )
      )}
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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Transaction Volume</CardTitle>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  activePeriod === p.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
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
          <Skeleton className="h-56 w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => (
                  <span className="capitalize text-muted-foreground">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="total"
              />
              <Line
                type="monotone"
                dataKey="bills"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="bills"
              />
              <Line
                type="monotone"
                dataKey="crypto"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="crypto"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

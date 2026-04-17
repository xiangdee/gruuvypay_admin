'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalytics } from '@/hooks/useFinance'
import { formatCurrency, cn } from '@/lib/utils'

type Period = 'daily' | 'weekly' | 'monthly'

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const PIE_COLORS = ['#3b82f6', '#6366f1', '#0ea5e9', '#a855f7', '#f59e0b']

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`
  return `₦${value}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-md text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-md text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {entry.value.toLocaleString('en-NG')}
          </span>
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <Skeleton className="h-56 w-full rounded-lg" />
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('weekly')
  const { data: analytics, isLoading } = useAnalytics({ period })

  const txVolume: { date: string; total: number; bills: number; crypto: number; transfers: number }[] =
    analytics?.transactionVolume ?? []

  const userGrowth: { date: string; users: number }[] = analytics?.userGrowth ?? []

  const revenueArea: { date: string; bills: number; crypto: number }[] =
    analytics?.revenue ?? []

  const txCount: { type: string; count: number }[] = analytics?.transactionCount ?? []

  const kycFunnel: { tier: string; count: number }[] = analytics?.kycFunnel ?? []

  const billCategories: { name: string; value: number }[] = analytics?.billCategories ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform usage metrics and growth indicators
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5 self-start">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                period === p.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Transaction Volume — LineChart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <LineChart data={txVolume} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
                <Tooltip content={<CurrencyTooltip />} />
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
                <Line
                  type="monotone"
                  dataKey="transfers"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="transfers"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 2 + 3: User Growth & Revenue side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 2. User Growth — BarChart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={userGrowth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<CountTooltip />} />
                  <Bar dataKey="users" name="New Users" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 3. Revenue — AreaChart stacked */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <AreaChart data={revenueArea} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="billsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cryptoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => (
                      <span className="capitalize text-muted-foreground">{value}</span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="bills"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="url(#billsGrad)"
                    name="bills"
                  />
                  <Area
                    type="monotone"
                    dataKey="crypto"
                    stackId="1"
                    stroke="#a855f7"
                    fill="url(#cryptoGrad)"
                    name="crypto"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4 + 5: Tx Count & KYC Funnel side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 4. Transaction Count — BarChart by type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Count by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart
                  data={txCount}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="type"
                    type="category"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip content={<CountTooltip />} />
                  <Bar dataKey="count" name="count" fill="#6366f1" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 5. KYC Funnel — horizontal BarChart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">KYC Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart
                  data={kycFunnel}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="tier"
                    type="category"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <Tooltip content={<CountTooltip />} />
                  <Bar dataKey="count" name="Users" fill="#0ea5e9" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6 + 7: Bill Categories & Geographic */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 6. Top Bill Categories — PieChart/donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Bill Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={224}>
                  <PieChart>
                    <Pie
                      data={billCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {billCategories.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [
                        typeof value === 'number' ? value.toLocaleString('en-NG') : value,
                        'Count',
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => (
                        <span className="capitalize text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7. Geographic — placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-center justify-center rounded-lg bg-muted/40 border border-dashed border-border">
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
                <p className="text-xs text-muted-foreground/70">
                  Geographic user distribution map
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

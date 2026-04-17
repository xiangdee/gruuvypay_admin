'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ShieldOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import FloatCard from '@/components/finance/FloatCard'
import RevenueBreakdown from '@/components/finance/RevenueBreakdown'
import { useVtpassBalance, useQuidaxBalance, useRevenue } from '@/hooks/useFinance'
import { formatCurrency, cn } from '@/lib/utils'

type TimeFilter = 'week' | 'month' | 'year' | 'custom'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
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

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`
  return `₦${value}`
}

const TIME_FILTERS: { label: string; value: TimeFilter }[] = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
]

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <ShieldOff className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p className="text-muted-foreground text-sm">
        You do not have permission to view this page.
      </p>
    </div>
  )
}

export default function FinancePage() {
  const { data: session } = useSession()
  const role = session?.user?.role

  const [activeFilter, setActiveFilter] = useState<TimeFilter>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const queryClient = useQueryClient()

  const {
    data: vtpassData,
    isLoading: vtpassLoading,
    dataUpdatedAt: vtpassUpdatedAt,
  } = useVtpassBalance()

  const {
    data: quidaxData,
    isLoading: quidaxLoading,
    dataUpdatedAt: quidaxUpdatedAt,
  } = useQuidaxBalance()

  const revenueParams =
    activeFilter === 'custom'
      ? { period: activeFilter, startDate: customStart, endDate: customEnd }
      : { period: activeFilter }

  const { data: revenueData, isLoading: revenueLoading } = useRevenue(revenueParams)

  if (role === 'SUPPORT') {
    return <AccessDenied />
  }

  const vtpassBalance: number =
    vtpassData?.balance ?? vtpassData?.data?.balance ?? 0
  const vtpassThreshold: number =
    vtpassData?.threshold ?? vtpassData?.data?.threshold ?? 10000
  const vtpassStatus: 'healthy' | 'low' =
    vtpassBalance >= vtpassThreshold ? 'healthy' : 'low'

  const quidaxBalance: number =
    quidaxData?.balance ?? quidaxData?.data?.balance ?? 0
  const quidaxThreshold: number =
    quidaxData?.threshold ?? quidaxData?.data?.threshold ?? 10000
  const quidaxStatus: 'healthy' | 'low' =
    quidaxBalance >= quidaxThreshold ? 'healthy' : 'low'

  const billsRevenue = revenueData?.bills ?? {
    allTime: 0,
    thisMonth: 0,
    lastMonth: 0,
    change: 0,
  }
  const cryptoRevenue = revenueData?.crypto ?? {
    allTime: 0,
    thisMonth: 0,
    lastMonth: 0,
    change: 0,
  }
  const totalRevenue = revenueData?.total ?? {
    allTime: 0,
    thisMonth: 0,
    lastMonth: 0,
    change: 0,
  }

  const chartData: { period: string; bills: number; crypto: number }[] =
    revenueData?.chart ?? []

  const summary = revenueData?.summary ?? {
    totalVolume: 0,
    transactionCount: 0,
    avgTransactionSize: 0,
    dailyAvgVolume: 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Float balances, revenue breakdown, and transaction analytics
        </p>
      </div>

      {/* Float Balances */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Float Balances</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FloatCard
            title="VTpass Float"
            balance={vtpassBalance}
            threshold={vtpassThreshold}
            status={vtpassStatus}
            dashboardUrl="https://vtpass.com/dashboard"
            lastRefreshed={vtpassUpdatedAt ? new Date(vtpassUpdatedAt) : null}
            onRefresh={() =>
              queryClient.invalidateQueries({ queryKey: ['finance', 'vtpass-balance'] })
            }
            loading={vtpassLoading}
          />
          <FloatCard
            title="Quidax Float"
            balance={quidaxBalance}
            threshold={quidaxThreshold}
            status={quidaxStatus}
            dashboardUrl="https://quidax.com/dashboard"
            lastRefreshed={quidaxUpdatedAt ? new Date(quidaxUpdatedAt) : null}
            onRefresh={() =>
              queryClient.invalidateQueries({ queryKey: ['finance', 'quidax-balance'] })
            }
            loading={quidaxLoading}
          />
        </div>
      </section>

      {/* Revenue Breakdown */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Revenue Breakdown</h2>
        {revenueLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : (
          <RevenueBreakdown
            billsRevenue={billsRevenue}
            cryptoRevenue={cryptoRevenue}
            totalRevenue={totalRevenue}
          />
        )}
      </section>

      {/* Time Filter */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
            {TIME_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  activeFilter === f.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {activeFilter === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          )}
        </div>

        {/* Revenue Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bills vs Crypto Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : chartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                No data for selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="period"
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
                  <Bar dataKey="bills" name="bills" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="crypto" name="crypto" fill="#a855f7" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Transaction Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total Volume (All Time)',
              value: revenueLoading ? null : formatCurrency(summary.totalVolume),
            },
            {
              label: 'Total Transactions',
              value: revenueLoading ? null : summary.transactionCount.toLocaleString('en-NG'),
            },
            {
              label: 'Avg Transaction Size',
              value: revenueLoading ? null : formatCurrency(summary.avgTransactionSize),
            },
            {
              label: 'Daily Avg Volume',
              value: revenueLoading ? null : formatCurrency(summary.dailyAvgVolume),
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {stat.value === null ? (
                  <Skeleton className="mt-2 h-7 w-32" />
                ) : (
                  <p className="mt-1 text-xl font-bold text-foreground">{stat.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

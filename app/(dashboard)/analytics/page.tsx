'use client'

import { useState } from 'react'
import type React from 'react'
import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useVolumeChart, useUserGrowthChart, useRevenueChart,
  useKycFunnel, useBillCategoriesChart, type ChartPeriod,
} from '@/hooks/useFinance'
import { formatCurrency, cn } from '@/lib/utils'

const PERIODS: { label: string; value: ChartPeriod }[] = [
  { label: 'Daily',   value: 'daily'   },
  { label: 'Weekly',  value: 'weekly'  },
  { label: 'Monthly', value: 'monthly' },
]

const PIE_COLORS = ['#6366f1', '#0ea5e9', '#a855f7', '#f59e0b', '#10b981']

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `₦${(value / 1_000).toFixed(0)}K`
  return `₦${value}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-lg text-xs space-y-1.5">
      <p className="font-semibold text-foreground pb-0.5 border-b border-border">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground ml-auto pl-3">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-lg text-xs space-y-1.5">
      <p className="font-semibold text-foreground pb-0.5 border-b border-border">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground ml-auto pl-3">{Number(entry.value).toLocaleString('en-NG')}</span>
        </div>
      ))}
    </div>
  )
}

function ChartCard({
  title, subtitle, children, loading, height = 224,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  loading?: boolean
  height?: number
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        {loading
          ? <Skeleton className="w-full rounded-lg" style={{ height }} />
          : children}
      </CardContent>
    </Card>
  )
}

function KpiCard({ label, value, sub, color, loading }: {
  label: string; value: string; sub?: string; color: string; loading?: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        {loading
          ? <><Skeleton className="h-7 w-28 mb-1" /><Skeleton className="h-3.5 w-16" /></>
          : <>
              <p className="text-xl font-bold tabular-nums text-foreground leading-none">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </>
        }
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<ChartPeriod>('weekly')

  const { data: volumeRaw,   isLoading: volumeLoading   } = useVolumeChart(period)
  const { data: growthRaw,   isLoading: growthLoading   } = useUserGrowthChart(period)
  const { data: revenueRaw,  isLoading: revenueLoading  } = useRevenueChart(period)
  const { data: kycFunnelRaw, isLoading: kycLoading     } = useKycFunnel()
  const { data: billCatsRaw, isLoading: billCatsLoading } = useBillCategoriesChart(30)

  const txVolume = (volumeRaw ?? []).map((d) => ({
    date: d.date, total: d.volume, bills: d.bills, crypto: d.crypto, transfers: d.transfers,
  }))
  const userGrowth  = (growthRaw  ?? []).map((d) => ({ date: d.date, users: d.newUsers }))
  const revenueArea = (revenueRaw ?? []).map((d) => ({ date: d.date, bills: d.billRevenue, crypto: d.cryptoRevenue }))
  const kycFunnel   = kycFunnelRaw ?? []
  const billCategories = (billCatsRaw ?? []).map((d) => ({ name: d.name, value: d.count, volume: d.volume }))

  // Derived KPIs from aggregated chart data
  const totalVolume   = txVolume.reduce((a, d) => a + d.total, 0)
  const totalNewUsers = userGrowth.reduce((a, d) => a + d.users, 0)
  const totalRevenue  = revenueArea.reduce((a, d) => a + d.bills + d.crypto, 0)
  const tier3         = kycFunnel.find((k) => k.tier === 'TIER_3')

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform usage metrics and growth indicators</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5 self-start">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                period === p.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI summary cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Volume"
          value={totalVolume > 0 ? formatCurrency(totalVolume) : '—'}
          sub={`${txVolume.length} data points`}
          color="#6366f1"
          loading={volumeLoading}
        />
        <KpiCard
          label="New Users"
          value={totalNewUsers > 0 ? totalNewUsers.toLocaleString() : '—'}
          sub="in selected period"
          color="#3b82f6"
          loading={growthLoading}
        />
        <KpiCard
          label="Platform Revenue"
          value={totalRevenue > 0 ? formatCurrency(totalRevenue) : '—'}
          sub="bills + crypto"
          color="#a855f7"
          loading={revenueLoading}
        />
        <KpiCard
          label="Fully Verified (Tier 3)"
          value={tier3 ? tier3.pct : '—'}
          sub={tier3 ? `${tier3.count.toLocaleString()} users` : 'No KYC data'}
          color="#10b981"
          loading={kycLoading}
        />
      </div>

      {/* ── Transaction Volume (full width) ── */}
      <ChartCard title="Transaction Volume" subtitle="Total, bills, and crypto over time" loading={volumeLoading} height={256}>
        <ResponsiveContainer width="100%" height={256}>
          <AreaChart data={txVolume} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="aGradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="aGradBills" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="aGradTransfers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={64} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value) => <span className="capitalize text-muted-foreground">{value}</span>} />
            <Area type="monotone" dataKey="total"     stroke="#6366f1" fill="url(#aGradTotal)"     strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="total"     />
            <Area type="monotone" dataKey="bills"     stroke="#0ea5e9" fill="url(#aGradBills)"     strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="bills"     />
            <Area type="monotone" dataKey="transfers" stroke="#f59e0b" fill="url(#aGradTransfers)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="transfers" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── User Growth & Revenue ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="User Growth" subtitle="New registrations per period" loading={growthLoading}>
          <ResponsiveContainer width="100%" height={224}>
            <BarChart data={userGrowth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="users" name="New Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Breakdown" subtitle="Bills vs crypto revenue over time" loading={revenueLoading}>
          <ResponsiveContainer width="100%" height={224}>
            <AreaChart data={revenueArea} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rGradBills" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="rGradCrypto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={64} />
              <Tooltip content={<CurrencyTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value) => <span className="capitalize text-muted-foreground">{value}</span>} />
              <Area type="monotone" dataKey="bills"  stroke="#0ea5e9" fill="url(#rGradBills)"  strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="bills"  />
              <Area type="monotone" dataKey="crypto" stroke="#a855f7" fill="url(#rGradCrypto)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="crypto" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── KYC Funnel & Bill Categories ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* KYC funnel — horizontal bar with percentage labels */}
        <ChartCard title="KYC Funnel" subtitle="User distribution across verification tiers" loading={kycLoading}>
          {kycFunnel.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No KYC data</p>
          ) : (
            <div className="space-y-4 py-1">
              {kycFunnel.map((k, i) => {
                const pct = parseFloat(k.pct) || 0
                const colors = ['bg-gray-400', 'bg-[#dbd861]', 'bg-violet-500', 'bg-emerald-500']
                return (
                  <div key={k.tier}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground">{k.label || k.tier}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums">{k.count.toLocaleString()} users</span>
                        <span className="text-xs font-semibold tabular-nums w-10 text-right">{k.pct}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', colors[i % colors.length])}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ChartCard>

        {/* Bill Categories — pie + ranked list */}
        <ChartCard title="Top Bill Categories" subtitle="Last 30 days by transaction count" loading={billCatsLoading}>
          {billCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <div className="flex gap-4 items-center">
              <div className="shrink-0">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={billCategories} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                      {billCategories.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value, 'Transactions']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-2.5">
                {billCategories.slice(0, 5).map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 text-xs text-foreground truncate">{c.name}</span>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">{c.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Crypto volume line chart ── */}
      <ChartCard title="Crypto vs Bills vs Transfers" subtitle="Detailed line comparison" loading={volumeLoading} height={224}>
        <ResponsiveContainer width="100%" height={224}>
          <LineChart data={txVolume} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={64} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value) => <span className="capitalize text-muted-foreground">{value}</span>} />
            <Line type="monotone" dataKey="bills"     stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="bills"     />
            <Line type="monotone" dataKey="crypto"    stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="crypto"    />
            <Line type="monotone" dataKey="transfers" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="transfers" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

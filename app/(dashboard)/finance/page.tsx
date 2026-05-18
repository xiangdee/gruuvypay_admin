'use client'

import { useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { useQueryClient } from '@tanstack/react-query'
import {
  ShieldOff, RefreshCw, ExternalLink, TrendingUp,
  Receipt, Bitcoin, Phone, Wallet, Users, Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useVtpassBalance, useQuidaxBalance, useRevenue, useFinanceSummary,
} from '@/hooks/useFinance'

type Period = 'week' | 'month' | 'year'
const PERIODS: { label: string; value: Period }[] = [
  { label: 'This Week',  value: 'week'  },
  { label: 'This Month', value: 'month' },
  { label: 'This Year',  value: 'year'  },
]

// ── Summary stat bar ──────────────────────────────────────────────────────────

function SummaryBar({ data, loading }: { data: any; loading: boolean }) {
  const stats = [
    { label: 'Total Users',      value: (data?.users ?? 0).toLocaleString(),        icon: Users     },
    { label: 'Txs Today',        value: (data?.txsToday ?? 0).toLocaleString(),      icon: Activity  },
    { label: 'Volume Today',     value: data?.volumeToday ?? '—',                    icon: TrendingUp },
    { label: 'Total Txs',        value: (data?.txsAllTime ?? 0).toLocaleString(),    icon: Receipt   },
    { label: 'All-Time Volume',  value: data?.volumeAllTime ?? '—',                  icon: Wallet    },
    { label: 'Pending KYC',      value: (data?.pendingKyc ?? 0).toLocaleString(),    icon: ShieldOff },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          {loading
            ? <Skeleton className="h-6 w-20" />
            : <p className="text-lg font-bold tabular-nums text-foreground leading-none">{value}</p>
          }
        </div>
      ))}
    </div>
  )
}

// ── Threshold progress bar ────────────────────────────────────────────────────

function ThresholdBar({ rawBalance, threshold, isLow }: {
  rawBalance?: number; threshold?: number; isLow?: boolean | null
}) {
  if (threshold == null || rawBalance == null) return null
  const pct = Math.min(100, (rawBalance / threshold) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>vs ₦{threshold.toLocaleString()} threshold</span>
        <span className={cn('font-semibold tabular-nums', isLow ? 'text-red-500' : 'text-emerald-500')}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', isLow ? 'bg-red-500' : 'bg-emerald-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Float card ────────────────────────────────────────────────────────────────

function FloatCard({
  title, balanceFormatted, ledgerFormatted, rawBalance,
  threshold, isLow, lastChecked, dashboardUrl, onRefresh, loading, error,
}: {
  title: string
  balanceFormatted?: string
  ledgerFormatted?: string
  rawBalance?: number
  threshold?: number
  isLow?: boolean | null
  lastChecked?: string
  dashboardUrl: string
  onRefresh: () => void
  loading: boolean
  error?: string
}) {
  function formatTs(s?: string) {
    if (!s) return 'Never'
    return new Date(s).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const statusColor = isLow === true ? 'text-red-500' : isLow === false ? 'text-emerald-500' : 'text-muted-foreground'
  const statusLabel = isLow === true ? 'Low' : isLow === false ? 'Healthy' : 'Unknown'
  const statusDot   = isLow === true ? 'bg-red-500' : isLow === false ? 'bg-emerald-500' : 'bg-muted-foreground'

  return (
    <Card className={cn('transition-all', isLow === true && 'border-red-300 dark:border-red-800/60')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', statusColor)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', statusDot, isLow === false && 'animate-pulse')} />
            {statusLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <>
            <div>
              <p className={cn('text-3xl font-bold tabular-nums leading-none', isLow === true ? 'text-red-500' : 'text-foreground')}>
                {balanceFormatted ?? '—'}
              </p>
              {ledgerFormatted && (
                <p className="text-xs text-muted-foreground mt-1">Ledger: {ledgerFormatted}</p>
              )}
            </div>
            <ThresholdBar rawBalance={rawBalance} threshold={threshold} isLow={isLow} />
          </>
        )}

        <div className="flex items-center justify-between pt-1">
          <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              Dashboard
            </Button>
          </a>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Updated {formatTs(lastChecked)}</span>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="rounded p-0.5 hover:bg-muted transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Revenue stat chip ─────────────────────────────────────────────────────────

function RevenueStat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-xl font-bold tabular-nums" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Revenue section ───────────────────────────────────────────────────────────

function RevenueSection({ data, loading }: { data: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No revenue data available</p>
  }

  const bills  = data.bills
  const crypto = data.crypto
  const atc    = data.airtimeToCash
  const total  = data.total

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RevenueStat label="Total Revenue"  value={total?.revenue   ?? '—'} sub={`Vol: ${total?.totalVolume ?? '—'}`}                 accent="#6366f1" />
        <RevenueStat label="Bills Revenue"  value={bills?.revenue   ?? '—'} sub={`${bills?.transactions ?? 0} txs`}                   accent="#0ea5e9" />
        <RevenueStat label="Crypto Revenue" value={crypto?.revenue  ?? '—'} sub={`Buy: ${crypto?.buyRevenue ?? '—'}`}                 accent="#a855f7" />
        <RevenueStat label="ATC Revenue"    value={atc?.netRevenue  ?? '—'} sub={`${atc?.transactions ?? 0} txs · ${atc?.netPerTx ?? '—'}/tx`} accent="#f59e0b" />
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Bills */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <CardTitle className="text-sm">Bill Payments</CardTitle>
                <p className="text-xs text-muted-foreground">Commission ~{bills?.commissionRate ?? '3.5%'}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Revenue</span>
              <span className="text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">{bills?.revenue ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Volume</span>
              <span className="text-sm font-semibold tabular-nums">{bills?.volume ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Transactions</span>
              <span className="text-sm font-semibold tabular-nums">{(bills?.transactions ?? 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Crypto */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <Bitcoin className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-sm">Crypto Trading</CardTitle>
                <p className="text-xs text-muted-foreground">Buy {crypto?.buySpread ?? '2%'} / Sell {crypto?.sellSpread ?? '1.5%'} spread</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Revenue</span>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400 tabular-nums">{crypto?.revenue ?? '—'}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Buy vol</span>
                <span className="font-semibold tabular-nums">{crypto?.buyVolume ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sell vol</span>
                <span className="font-semibold tabular-nums">{crypto?.sellVolume ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Buy txs</span>
                <span className="font-semibold tabular-nums">{(crypto?.buyTxs ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sell txs</span>
                <span className="font-semibold tabular-nums">{(crypto?.sellTxs ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ATC */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-sm">Airtime to Cash</CardTitle>
                <p className="text-xs text-muted-foreground">Fee {atc?.feePerTx ?? '₦100'}/tx</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Net Revenue</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">{atc?.netRevenue ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Gross Revenue</span>
              <span className="text-sm font-semibold tabular-nums">{atc?.grossRevenue ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ATC Cost</span>
              <span className="text-sm font-semibold tabular-nums">{atc?.atcCost ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Volume</span>
              <span className="text-sm font-semibold tabular-nums">{atc?.volume ?? '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Access denied ─────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <ShieldOff className="h-12 w-12 text-muted-foreground/30" />
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p className="text-muted-foreground text-sm">You do not have permission to view this page.</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const admin = useAdmin()
  const role  = admin?.role
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState<Period>('month')

  const { data: flwData,    isLoading: flwLoading    } = useVtpassBalance()
  const { data: quidaxData, isLoading: quidaxLoading } = useQuidaxBalance()
  const { data: revenueData, isLoading: revenueLoading } = useRevenue({ period })
  const { data: summary,     isLoading: summaryLoading } = useFinanceSummary()

  if (role === 'SUPPORT') return <AccessDenied />

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Float balances, revenue breakdown, and platform summary
        </p>
      </div>

      {/* ── Platform Summary ── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Platform Summary</h2>
        <SummaryBar data={summary} loading={summaryLoading} />
      </section>

      {/* ── Float Balances ── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Float Balances</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FloatCard
            title="Flutterwave Balance"
            balanceFormatted={flwData?.availableFormatted}
            ledgerFormatted={flwData?.ledgerFormatted}
            rawBalance={flwData?.available}
            threshold={flwData?.threshold}
            isLow={flwData?.isLow}
            lastChecked={flwData?.lastChecked}
            dashboardUrl="https://dashboard.flutterwave.com"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['finance', 'vtpass-balance'] })}
            loading={flwLoading}
            error={flwData?.error}
          />
          <FloatCard
            title="Quidax Balance"
            balanceFormatted={quidaxData?.balanceFormatted}
            rawBalance={quidaxData?.balance}
            threshold={quidaxData?.threshold}
            isLow={quidaxData?.isLow}
            lastChecked={quidaxData?.lastChecked}
            dashboardUrl="https://app.quidax.com"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['finance', 'quidax-balance'] })}
            loading={quidaxLoading}
            error={quidaxData?.error}
          />
        </div>
      </section>

      {/* ── Revenue Breakdown ── */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Revenue Breakdown</h2>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
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
        {revenueData?.from && (
          <p className="text-xs text-muted-foreground mb-4">
            Period: <span className="font-medium">{revenueData.from}</span>
          </p>
        )}
        <RevenueSection data={revenueData} loading={revenueLoading} />
      </section>
    </div>
  )
}

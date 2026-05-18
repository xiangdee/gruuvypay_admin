'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, TrendingUp, Activity, DollarSign, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import adminApi from '@/lib/api'
import { useAdmin } from '@/hooks/useAdmin'
import { useVtpassBalance, useQuidaxBalance } from '@/hooks/useFinance'
import { useTransactions } from '@/hooks/useTransactions'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import BalanceAlerts from '@/components/dashboard/BalanceAlerts'
import VolumeChart, { type Period } from '@/components/charts/VolumeChart'
import UserGrowthChart from '@/components/charts/UserGrowthChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalUsers:        { value: number; change: string }
  volumeToday:       { value: string; change: string }
  txsToday:          { value: number; change: string }
  revenueThisMonth:  { value: string; note: string }
  activePendingTxs:  number
}

function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => adminApi.get('/admin/analytics/dashboard').then((r) => r.data),
  })
}

function useVolumeChart(period: Period) {
  return useQuery({
    queryKey: ['analytics', 'volume', period],
    queryFn: () => adminApi.get('/admin/analytics/volume', { params: { period } }).then((r) => r.data),
  })
}

function useUserGrowth() {
  return useQuery({
    queryKey: ['analytics', 'users'],
    queryFn: () => adminApi.get('/admin/analytics/users').then((r) => r.data),
  })
}

function useBillCategories() {
  return useQuery({
    queryKey: ['analytics', 'bill-categories'],
    queryFn: () => adminApi.get('/admin/analytics/bill-categories').then((r) => r.data),
  })
}

function BillCategoriesCard() {
  const { data: categories, isLoading } = useBillCategories()
  const items = Array.isArray(categories) ? categories : []

  const COLORS = ['bg-indigo-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500']

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Top Bill Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          <div className="space-y-2.5">
            {items.slice(0, 5).map((c: { name: string; count: number; volume: string }, i: number) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className={cn('h-2 w-2 rounded-full shrink-0', COLORS[i % COLORS.length])} />
                <span className="flex-1 text-sm text-foreground truncate">{c.name}</span>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums">{c.volume}</p>
                  <p className="text-xs text-muted-foreground">{c.count} txs</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PendingBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
      <Clock className="h-3 w-3" />
      {count} pending
    </span>
  )
}

export default function DashboardPage() {
  const admin = useAdmin()
  const { data: stats, isLoading: statsLoading } = useDashboard()
  const { data: vtpassData, isLoading: vtpassLoading } = useVtpassBalance()
  const { data: quidaxData, isLoading: quidaxLoading } = useQuidaxBalance()
  const { data: txData, isLoading: txLoading } = useTransactions({ limit: 10, page: 1 })
  const [period, setPeriod] = useState<Period>('daily')
  const { data: volumeData, isLoading: volumeLoading } = useVolumeChart(period)
  const { data: userGrowthData, isLoading: growthLoading } = useUserGrowth()

  const balancesLoading = vtpassLoading || quidaxLoading
  const recentTransactions = txData?.data ?? []

  const volumeChart = Array.isArray(volumeData)
    ? volumeData.map((d: { date: string; volume: number; bills: number; crypto: number }) => ({
        date:   d.date,
        total:  d.volume,
        bills:  d.bills,
        crypto: d.crypto,
      }))
    : []

  const userGrowth = Array.isArray(userGrowthData)
    ? userGrowthData.map((d: { date: string; newUsers: number }) => ({ date: d.date, users: d.newUsers }))
    : []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = admin?.name?.split(' ')[0]
  const dateStr = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dateStr} &middot; Here&apos;s what&apos;s happening with GruuvyPay
          </p>
        </div>
        {!statsLoading && stats?.activePendingTxs != null && (
          <PendingBadge count={stats.activePendingTxs} />
        )}
      </div>

      {/* ── Balance alerts ── */}
      {!balancesLoading && <BalanceAlerts vtpassData={vtpassData} quidaxData={quidaxData} />}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={statsLoading ? '—' : (stats?.totalUsers?.value ?? 0).toLocaleString()}
          change={stats?.totalUsers?.change}
          icon={<Users className="h-5 w-5" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Volume Today"
          value={statsLoading ? '—' : (stats?.volumeToday?.value ?? '₦0.00')}
          change={stats?.volumeToday?.change}
          icon={<TrendingUp className="h-5 w-5" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Transactions Today"
          value={statsLoading ? '—' : (stats?.txsToday?.value ?? 0).toLocaleString()}
          change={stats?.txsToday?.change}
          icon={<Activity className="h-5 w-5" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Revenue This Month"
          value={statsLoading ? '—' : (stats?.revenueThisMonth?.value ?? '₦0.00')}
          note={stats?.revenueThisMonth?.note}
          icon={<DollarSign className="h-5 w-5" />}
          loading={statsLoading}
        />
      </div>

      {/* ── Volume chart ── */}
      <VolumeChart data={volumeChart} loading={volumeLoading} onPeriodChange={setPeriod} />

      {/* ── Recent Txs + sidebar ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent Transactions list */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <RecentTransactions transactions={recentTransactions} loading={txLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: user growth + bill categories */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <UserGrowthChart data={userGrowth} loading={growthLoading} />
          <BillCategoriesCard />
        </div>
      </div>
    </div>
  )
}

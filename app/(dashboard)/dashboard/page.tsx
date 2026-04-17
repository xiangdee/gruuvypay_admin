'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, TrendingUp, Activity, DollarSign, Clock } from 'lucide-react'
import adminApi from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useVtpassBalance, useQuidaxBalance } from '@/hooks/useFinance'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import BalanceAlerts from '@/components/dashboard/BalanceAlerts'
import VolumeChart, { type Period } from '@/components/charts/VolumeChart'
import UserGrowthChart from '@/components/charts/UserGrowthChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  totalUsers: number
  totalVolumeToday: number
  activeTransactions: number
  revenueThisMonth: number
  userChange: string
  volumeChange: string
  revenueChange: string
  volumeChart: { date: string; total: number; bills: number; crypto: number }[]
  userGrowth: { date: string; users: number }[]
  recentTransactions: {
    id?: string
    reference: string
    user?: { name?: string; email?: string } | string
    type: string
    amount: number
    status: string
    createdAt?: string
    date?: string
  }[]
  kycPending?: {
    id: string
    name: string
    email: string
    submittedAt: string
  }[]
  topBillCategories?: { category: string; count: number }[]
}

function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.get('/admin/dashboard/stats').then((r) => r.data),
  })
}

function KycPendingList({
  items,
  loading,
}: {
  items?: DashboardStats['kycPending']
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No pending KYC submissions
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((kyc) => (
        <li key={kyc.id} className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{kyc.name}</p>
            <p className="truncate text-xs text-muted-foreground">{kyc.email}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function TopBillCategoriesPlaceholder() {
  const placeholderCategories = [
    { category: 'Airtime', pct: 45, color: '#3b82f6' },
    { category: 'Data', pct: 28, color: '#6366f1' },
    { category: 'Electricity', pct: 17, color: '#0ea5e9' },
    { category: 'Cable TV', pct: 7, color: '#a855f7' },
    { category: 'Others', pct: 3, color: '#e2e8f0' },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground italic">Sample data — connect API to populate</p>
      {placeholderCategories.map((c) => (
        <div key={c.category} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground">{c.category}</span>
            <span className="text-muted-foreground">{c.pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${c.pct}%`, backgroundColor: c.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: vtpassData, isLoading: vtpassLoading } = useVtpassBalance()
  const { data: quidaxData, isLoading: quidaxLoading } = useQuidaxBalance()
  const [_period, setPeriod] = useState<Period>('daily')

  const vtpassBalance: number = vtpassData?.balance ?? vtpassData?.data?.balance ?? 0
  const quidaxBalance: number = quidaxData?.balance ?? quidaxData?.data?.balance ?? 0
  const balancesReady = !vtpassLoading && !quidaxLoading

  return (
    <div className="space-y-6">
      {/* Balance alerts */}
      {balancesReady && (
        <BalanceAlerts
          vtpassBalance={vtpassBalance}
          quidaxBalance={quidaxBalance}
        />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={statsLoading ? '—' : (stats?.totalUsers ?? 0).toLocaleString()}
          change={stats?.userChange}
          icon={<Users className="h-5 w-5" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Volume Today"
          value={statsLoading ? '—' : formatCurrency(stats?.totalVolumeToday ?? 0)}
          change={stats?.volumeChange}
          icon={<TrendingUp className="h-5 w-5" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Active Transactions"
          value={statsLoading ? '—' : (stats?.activeTransactions ?? 0).toLocaleString()}
          icon={<Activity className="h-5 w-5" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Revenue This Month"
          value={statsLoading ? '—' : formatCurrency(stats?.revenueThisMonth ?? 0)}
          change={stats?.revenueChange}
          icon={<DollarSign className="h-5 w-5" />}
          loading={statsLoading}
        />
      </div>

      {/* Charts + Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Volume chart — takes up 3/5 */}
        <div className="lg:col-span-3">
          <VolumeChart
            data={stats?.volumeChart ?? []}
            loading={statsLoading}
            onPeriodChange={setPeriod}
          />
        </div>

        {/* Recent transactions — takes up 2/5 */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RecentTransactions
                transactions={stats?.recentTransactions ?? []}
                loading={statsLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* User Growth */}
        <UserGrowthChart
          data={stats?.userGrowth ?? []}
          loading={statsLoading}
        />

        {/* Top Bill Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Bill Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <TopBillCategoriesPlaceholder />
          </CardContent>
        </Card>

        {/* Recent KYC Pending */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">KYC Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <KycPendingList items={stats?.kycPending} loading={statsLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

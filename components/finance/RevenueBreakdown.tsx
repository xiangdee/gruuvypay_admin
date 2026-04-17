'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface RevenueStat {
  allTime: number
  thisMonth: number
  lastMonth: number
  change: number
}

interface RevenueBreakdownProps {
  billsRevenue: RevenueStat
  cryptoRevenue: RevenueStat
  totalRevenue: RevenueStat
}

function ChangeIndicator({ change }: { change: number }) {
  const isPositive = change >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? 'text-green-600' : 'text-red-500'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? '+' : ''}
      {change.toFixed(1)}%
    </span>
  )
}

function RevenueCard({ title, stat }: { title: string; stat: RevenueStat }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">All Time</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(stat.allTime)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">This Month</p>
            <p className="text-sm font-semibold">{formatCurrency(stat.thisMonth)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Last Month</p>
            <p className="text-sm font-semibold">{formatCurrency(stat.lastMonth)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">vs last month:</span>
          <ChangeIndicator change={stat.change} />
        </div>
      </CardContent>
    </Card>
  )
}

export default function RevenueBreakdown({
  billsRevenue,
  cryptoRevenue,
  totalRevenue,
}: RevenueBreakdownProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <RevenueCard title="Bill Payments Revenue" stat={billsRevenue} />
      <RevenueCard title="Crypto Revenue" stat={cryptoRevenue} />
      <RevenueCard title="Total Revenue" stat={totalRevenue} />
    </div>
  )
}

'use client'

import { ExternalLink, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'

interface FloatCardProps {
  title: string
  balance: number
  threshold: number
  status: 'healthy' | 'low'
  dashboardUrl: string
  lastRefreshed: string | Date | null
  onRefresh: () => void
  loading: boolean
}

function formatTimestamp(ts: string | Date | null): string {
  if (!ts) return 'Never'
  const d = typeof ts === 'string' ? new Date(ts) : ts
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function FloatCard({
  title,
  balance,
  threshold,
  status,
  dashboardUrl,
  lastRefreshed,
  onRefresh,
  loading,
}: FloatCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="text-lg" title={status === 'healthy' ? 'Healthy' : 'Low balance'}>
            {status === 'healthy' ? '🟢' : '🔴'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <p
            className={`text-3xl font-bold ${
              status === 'low' ? 'text-red-500' : 'text-foreground'
            }`}
          >
            {formatCurrency(balance)}
          </p>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Threshold:</span>
          <span className="font-medium text-foreground">{formatCurrency(threshold)}</span>
        </div>

        <div className="flex items-center justify-between">
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3.5 w-3.5" />
              View Dashboard
            </Button>
          </a>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Last updated: {formatTimestamp(lastRefreshed)}</span>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="rounded p-0.5 hover:bg-muted transition-colors disabled:opacity-50"
              title="Refresh balance"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

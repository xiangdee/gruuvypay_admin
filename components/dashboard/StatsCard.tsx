'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  note?: string
  icon: React.ReactNode
  loading?: boolean
}

function ChangeChip({ change }: { change: string }) {
  const isPos = change.trimStart().startsWith('+')
  const isNeg = change.trimStart().startsWith('-')
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
      isPos ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
      isNeg ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
              'bg-muted text-muted-foreground',
    )}>
      {isPos ? <TrendingUp className="h-3 w-3" /> : isNeg ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {change}
    </span>
  )
}

export default function StatsCard({ title, value, change, note, icon, loading = false }: StatsCardProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3.5 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md dark:hover:shadow-none dark:hover:border-border/70">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dbd861]/12 text-[#dbd861]">
            {icon}
          </div>
          {change && <ChangeChip change={change} />}
        </div>
        <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums leading-none mb-1.5">
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {note && <p className="text-xs text-muted-foreground/70 mt-0.5">{note}</p>}
      </CardContent>
    </Card>
  )
}

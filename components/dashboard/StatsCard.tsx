'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  loading?: boolean
}

function isPositiveChange(change: string): boolean {
  return change.trimStart().startsWith('+')
}

function isNegativeChange(change: string): boolean {
  return change.trimStart().startsWith('-')
}

export default function StatsCard({ title, value, change, icon, loading = false }: StatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {change && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                  isPositiveChange(change) && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  isNegativeChange(change) && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  !isPositiveChange(change) && !isNegativeChange(change) && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                )}
              >
                {change}
              </span>
            )}
          </div>
          <div className="ml-4 shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

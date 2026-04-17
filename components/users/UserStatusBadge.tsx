'use client'

import { cn } from '@/lib/utils'

interface UserStatusBadgeProps {
  status: string
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  deactivated: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspended',
  deactivated: 'Deactivated',
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const key = status?.toLowerCase() ?? ''
  const styles = STATUS_STYLES[key] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
  const label = STATUS_LABELS[key] ?? status

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        styles
      )}
    >
      {label}
    </span>
  )
}

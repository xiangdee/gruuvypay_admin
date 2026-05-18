'use client'

import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; dot: string; class: string }> = {
  ACTIVE:    { label: 'Active',    dot: 'bg-emerald-500', class: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  SUSPENDED: { label: 'Suspended', dot: 'bg-red-500',     class: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
  PENDING:   { label: 'Pending',   dot: 'bg-amber-500',   class: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  DELETED:   { label: 'Deleted',   dot: 'bg-gray-400',    class: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' },
}

export function UserStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] ?? STATUS_CONFIG['PENDING']
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium', cfg.class)}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

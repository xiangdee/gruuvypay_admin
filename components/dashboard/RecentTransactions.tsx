'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency, formatRelativeDate } from '@/lib/utils'

interface Transaction {
  id?: string
  reference: string
  user?: { name?: string; email?: string } | string
  type: string
  amount: number
  status: string
  createdAt?: string
  date?: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  loading?: boolean
}

function statusClass(status: string): string {
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
    case 'CREDIT':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'FAILED':
    case 'SUSPENDED':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'ACTIVE':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function typeClass(type: string): string {
  switch (type?.toUpperCase()) {
    case 'CRYPTO':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'BILL':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getUserName(user: Transaction['user']): string {
  if (!user) return '—'
  if (typeof user === 'string') return user
  return user.name || user.email || '—'
}

function getDate(tx: Transaction): string {
  const raw = tx.createdAt || tx.date
  if (!raw) return '—'
  try {
    return formatRelativeDate(raw)
  } catch {
    return raw
  }
}

export default function RecentTransactions({ transactions, loading = false }: RecentTransactionsProps) {
  const skeletonRows = Array.from({ length: 10 })

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Reference</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? skeletonRows.map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            : (transactions ?? []).slice(0, 10).map((tx, i) => (
                <TableRow key={tx.id ?? tx.reference ?? i}>
                  <TableCell>
                    <span className="font-mono text-xs truncate max-w-[7rem] block" title={tx.reference}>
                      {tx.reference}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{getUserName(tx.user)}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                        typeClass(tx.type)
                      )}
                    >
                      {tx.type?.toLowerCase() ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                        statusClass(tx.status)
                      )}
                    >
                      {tx.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {getDate(tx)}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}

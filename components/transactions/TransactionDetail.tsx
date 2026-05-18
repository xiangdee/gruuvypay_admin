'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from './TransactionTable'

interface TransactionDetailProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

function statusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'FAILED':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'PROCESSING':
      return 'bg-blue-100 text-[#C8FF57] dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function typeBadgeClass(type: string): string {
  switch (type?.toUpperCase()) {
    case 'DEPOSIT':
      return 'bg-blue-100 text-[#C8FF57] dark:bg-blue-900/30 dark:text-blue-400'
    case 'WITHDRAWAL':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'TRANSFER':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'FEE':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getUserDisplay(user: Transaction['user']): { name: string; email: string } {
  if (!user) return { name: '—', email: '—' }
  if (typeof user === 'string') return { name: user, email: '—' }
  return {
    name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '—',
    email: (user as { email?: string }).email || `@${user.username}` || '—',
  }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-1 items-start py-2 border-b border-border last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <div className="text-sm text-foreground break-words">{children}</div>
    </div>
  )
}

export default function TransactionDetail({ transaction, open, onClose }: TransactionDetailProps) {
  if (!transaction) return null

  const { name: userName, email: userEmail } = getUserDisplay(transaction.user)
  const hasMetadata = transaction.metadata && Object.keys(transaction.metadata).length > 0

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-0">
          <DetailRow label="Reference">
            <span className="font-mono text-xs break-all">{transaction.reference}</span>
          </DetailRow>

          <DetailRow label="Type">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
                typeBadgeClass(transaction.type)
              )}
            >
              {transaction.type}
            </span>
          </DetailRow>

          <DetailRow label="Status">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
                statusBadgeClass(transaction.status)
              )}
            >
              {transaction.status}
            </span>
          </DetailRow>

          <DetailRow label="Amount">
            <span className="font-semibold tabular-nums">{transaction.amount ?? '—'}</span>
          </DetailRow>

          {transaction.narration && (
            <DetailRow label="Narration">
              <span className="text-sm">{transaction.narration}</span>
            </DetailRow>
          )}

          <DetailRow label="User Name">
            <span>{userName}</span>
          </DetailRow>

          <DetailRow label="User Email">
            <span>{userEmail}</span>
          </DetailRow>

          <DetailRow label="Created At">
            <span>{transaction.createdAt ? formatDate(transaction.createdAt) : '—'}</span>
          </DetailRow>

          <DetailRow label="Updated At">
            <span>{transaction.updated_at ? formatDate(transaction.updated_at) : '—'}</span>
          </DetailRow>

          {transaction.auditAdmin && (
            <DetailRow label="Audit">
              <span className="text-sm text-muted-foreground">
                Action by <span className="font-medium text-foreground">{transaction.auditAdmin}</span>
                {transaction.auditAt && (
                  <> at {formatDate(transaction.auditAt)}</>
                )}
              </span>
            </DetailRow>
          )}

          {hasMetadata && (
            <DetailRow label="Metadata">
              <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </DetailRow>
          )}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

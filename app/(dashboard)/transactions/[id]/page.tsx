'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { ArrowLeft, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import EditTransactionModal from '@/components/transactions/EditTransactionModal'
import { useTransaction, useDeleteTransaction } from '@/hooks/useTransactions'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/components/transactions/TransactionTable'

// Note: This page follows Next.js 16 pattern where params is a Promise.
// Using 'use client' with React.use() to unwrap the promise.
export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <TransactionDetailView id={id} />
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
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function typeBadgeClass(type: string): string {
  switch (type?.toUpperCase()) {
    case 'DEPOSIT':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
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
  return { name: user.name || '—', email: user.email || '—' }
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

function TransactionDetailView({ id }: { id: string }) {
  const router = useRouter()
  const { data, isLoading, error } = useTransaction(id)
  const deleteMutation = useDeleteTransaction()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const tx: Transaction | null = data?.data ?? data ?? null

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE' || !tx) return
    try {
      await deleteMutation.mutateAsync(tx.id)
      toast.success('Transaction deleted')
      router.push('/transactions')
    } catch {
      toast.error('Failed to delete transaction')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-48" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !tx) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Transaction not found or failed to load.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const { name: userName, email: userEmail } = getUserDisplay(tx.user)
  const hasMetadata = tx.metadata && Object.keys(tx.metadata).length > 0

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Transaction Detail</h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{tx.reference}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DetailItem label="Reference">
            <span className="font-mono text-xs break-all">{tx.reference}</span>
          </DetailItem>

          <DetailItem label="Amount">
            <span className="text-lg font-bold tabular-nums">{formatCurrency(tx.amount ?? 0)}</span>
          </DetailItem>

          <DetailItem label="Type">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase',
                typeBadgeClass(tx.type)
              )}
            >
              {tx.type}
            </span>
          </DetailItem>

          <DetailItem label="Status">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase',
                statusBadgeClass(tx.status)
              )}
            >
              {tx.status}
            </span>
          </DetailItem>

          {tx.narration && (
            <DetailItem label="Narration">
              <span>{tx.narration}</span>
            </DetailItem>
          )}

          <DetailItem label="Created At">
            <span>{tx.createdAt ? formatDate(tx.createdAt) : '—'}</span>
          </DetailItem>

          <DetailItem label="Updated At">
            <span>{tx.updatedAt ? formatDate(tx.updatedAt) : '—'}</span>
          </DetailItem>
        </CardContent>
      </Card>

      {/* User info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DetailItem label="Name">{userName}</DetailItem>
          <DetailItem label="Email">{userEmail}</DetailItem>
        </CardContent>
      </Card>

      {/* Audit */}
      {tx.auditAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Action by{' '}
              <span className="font-medium text-foreground">{tx.auditAdmin}</span>
              {tx.auditAt && <> at {formatDate(tx.auditAt)}</>}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {hasMetadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted rounded-md p-4 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
              {JSON.stringify(tx.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Edit modal */}
      <EditTransactionModal
        transaction={tx}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {/* Delete dialog */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteOpen(false)
            setDeleteConfirm('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              This is irreversible. Type{' '}
              <span className="font-semibold text-destructive">DELETE</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-2">
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Type "DELETE" to confirm'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteOpen(false); setDeleteConfirm('') }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteConfirm !== 'DELETE' || deleteMutation.isPending}
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

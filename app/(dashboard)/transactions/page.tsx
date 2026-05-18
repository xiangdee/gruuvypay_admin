'use client'

import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Search, Download } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TransactionTable, { type Transaction } from '@/components/transactions/TransactionTable'
import TransactionDetail from '@/components/transactions/TransactionDetail'
import EditTransactionModal from '@/components/transactions/EditTransactionModal'
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions'

const PAGE_SIZE = 25

const TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Withdrawal', value: 'WITHDRAWAL' },
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Fee', value: 'FEE' },
]

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Failed', value: 'FAILED' },
]

// Hardcoded role for client — would normally come from session context
// Using SUPER_ADMIN to display all action buttons; adapt as needed.
const USER_ROLE = 'SUPER_ADMIN'

function exportCsv(data: Transaction[]) {
  if (!data.length) {
    toast.error('No data to export')
    return
  }
  const headers = ['Reference', 'Type', 'Amount', 'Status', 'Created At']
  const rows = data.map((tx) => [
    tx.reference,
    tx.type,
    tx.amount,
    tx.status,
    tx.created_at ?? tx.createdAt ?? '',
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(amountMin ? { amountMin: Number(amountMin) } : {}),
    ...(amountMax ? { amountMax: Number(amountMax) } : {}),
  }

  const { data: txData, isLoading } = useTransactions(params)
  const deleteMutation = useDeleteTransaction()

  // API returns { data: Transaction[], meta: { total, page, limit, pages } }
  const transactions: Transaction[] = txData?.data ?? []
  const total: number = txData?.meta?.total ?? 0
  const totalPages = txData?.meta?.pages ?? Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleDelete = useCallback(async () => {
    if (!deleteTx || deleteConfirm !== 'DELETE') return
    try {
      await deleteMutation.mutateAsync(deleteTx.id)
      toast.success('Transaction deleted')
      setDeleteTx(null)
      setDeleteConfirm('')
    } catch {
      toast.error('Failed to delete transaction')
    }
  }, [deleteTx, deleteConfirm, deleteMutation])

  const resetFilters = () => {
    setSearch('')
    setType('')
    setStatus('')
    setDateFrom('')
    setDateTo('')
    setAmountMin('')
    setAmountMax('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? 'Loading…' : `${total.toLocaleString()} total`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCsv(transactions)}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Search */}
            <div className="space-y-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Reference or narration…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type || 'all'} onValueChange={(v) => { setType(v == null || v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value || 'all'} value={o.value || 'all'}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status || 'all'} onValueChange={(v) => { setStatus(v == null || v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value || 'all'} value={o.value || 'all'}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="space-y-1.5">
              <Label className="text-xs">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              />
            </div>

            {/* Amount range */}
            <div className="space-y-1.5">
              <Label className="text-xs">Min Amount (₦)</Label>
              <Input
                type="number"
                placeholder="0"
                value={amountMin}
                onChange={(e) => { setAmountMin(e.target.value); setPage(1) }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Max Amount (₦)</Label>
              <Input
                type="number"
                placeholder="∞"
                value={amountMax}
                onChange={(e) => { setAmountMax(e.target.value); setPage(1) }}
              />
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <TransactionTable
        data={transactions}
        loading={isLoading}
        onView={setSelectedTx}
        onEdit={setEditTx}
        onDelete={setDeleteTx}
        userRole={USER_ROLE}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Detail modal */}
      <TransactionDetail
        transaction={selectedTx}
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      {/* Edit modal */}
      <EditTransactionModal
        transaction={editTx}
        open={!!editTx}
        onClose={() => setEditTx(null)}
      />

      {/* Delete confirm dialog */}
      <AlertDialog
        open={!!deleteTx}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTx(null)
            setDeleteConfirm('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. Type{' '}
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
            <AlertDialogCancel onClick={() => { setDeleteTx(null); setDeleteConfirm('') }}>
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

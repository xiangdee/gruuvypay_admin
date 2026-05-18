'use client'
'use no memo'

import React, { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import TransactionDetail from '@/components/transactions/TransactionDetail'
import { useBillTransactions } from '@/hooks/useTransactions'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/components/transactions/TransactionTable'

const PAGE_SIZE = 25

// Bills = WITHDRAWAL transactions. Status uses TxStatus enum (uppercase).
const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Reversed', value: 'REVERSED' },
]

function statusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case 'SUCCESS': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'FAILED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'REVERSED': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getUserDisplay(user: Transaction['user']): { name: string; tag: string; id?: string } {
  if (!user) return { name: '—', tag: '' }
  if (typeof user === 'string') return { name: user, tag: '' }
  return {
    name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '—',
    tag: user.username ? `@${user.username}` : '',
    id: user.id,
  }
}

function StatCard({ title, value, loading }: { title: string; value: string | number; loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-7 w-32" /> : <p className="text-xl font-bold">{value}</p>}
      </CardContent>
    </Card>
  )
}

// Parse a pre-formatted amount string like "₦1,234.56" to a number
function parseAmount(s: string | undefined): number {
  if (!s) return 0
  return parseFloat(s.replace(/[₦,]/g, '')) || 0
}

export default function BillsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const router = useRouter()

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
  }

  const { data: billData, isLoading } = useBillTransactions(params)

  // Bills endpoint returns { data: Transaction[], meta: { total, page, limit, pages } }
  const transactions: Transaction[] = billData?.data ?? []
  const total: number = billData?.meta?.total ?? 0
  const totalPages = billData?.meta?.pages ?? Math.max(1, Math.ceil(total / PAGE_SIZE))

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todayTxs = transactions.filter(
      (t) => { const d = t.created_at ?? t.createdAt; return !!d && new Date(d).toDateString() === today }
    )
    const successCount = todayTxs.filter((t) => t.status?.toUpperCase() === 'SUCCESS').length
    const successRate = todayTxs.length > 0 ? Math.round((successCount / todayTxs.length) * 100) : 0
    const totalVolume = transactions.reduce((sum, t) => sum + parseAmount(t.amount), 0)
    return { todayCount: todayTxs.length, successRate, totalVolume }
  }, [transactions])

  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="font-mono text-xs truncate max-w-36 block" title={row.original.reference}>
          {row.original.reference}
        </span>
      ),
    },
    {
      id: 'user',
      header: 'User',
      cell: ({ row }) => {
        const { name, tag, id } = getUserDisplay(row.original.user)
        return (
          <div className={cn('min-w-0', id ? 'cursor-pointer hover:underline' : '')} onClick={() => id && router.push(`/users/${id}`)}>
            <p className="text-sm font-medium truncate">{name}</p>
            {tag && <p className="text-xs text-muted-foreground truncate">{tag}</p>}
          </div>
        )
      },
    },
    {
      id: 'narration',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-48 block">
          {row.original.narration ?? '—'}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-sm">{row.original.amount ?? '—'}</span>
      ),
    },
    {
      id: 'fee',
      header: 'Fee',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">{row.original.fee ?? '—'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase', statusBadgeClass(row.original.status))}>
          {row.original.status}
        </span>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {(row.original.created_at ?? row.original.createdAt) ? formatDate(row.original.created_at ?? row.original.createdAt ?? '') : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon-sm" onClick={() => setSelectedTx(row.original)}>
          <span className="sr-only">View</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </Button>
      ),
    },
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: transactions, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bill Payments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isLoading ? 'Loading…' : `${total.toLocaleString()} total`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Payments Today" value={stats.todayCount.toLocaleString()} loading={isLoading} />
        <StatCard title="Success Rate Today" value={`${stats.successRate}%`} loading={isLoading} />
        <StatCard title="Total Volume" value={formatCurrency(stats.totalVolume)} loading={isLoading} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Reference or narration…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-8" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : (v ?? '')); setPage(1) }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => <SelectItem key={o.value || 'all'} value={o.value || 'all'}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setSearch(''); setStatus(''); setPage(1) }}>Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columns.length }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">No bill payments found.</TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page} of {totalPages} &middot; {total.toLocaleString()} total</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      <TransactionDetail transaction={selectedTx} open={!!selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}

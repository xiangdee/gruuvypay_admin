'use client'

import React, { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { Search, Eye } from 'lucide-react'
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
import { useCryptoTransactions } from '@/hooks/useTransactions'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/components/transactions/TransactionTable'

const PAGE_SIZE = 25

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Failed', value: 'FAILED' },
]

const CRYPTO_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Buy', value: 'BUY' },
  { label: 'Sell', value: 'SELL' },
  { label: 'Receive', value: 'RECEIVE' },
  { label: 'Send', value: 'SEND' },
]

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

function cryptoTypeBadgeClass(type: string): string {
  switch (type?.toUpperCase()) {
    case 'BUY':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'SELL':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'RECEIVE':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'SEND':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getUserDisplay(user: Transaction['user']): { name: string; tag: string; id?: string } {
  if (!user) return { name: '—', tag: '' }
  if (typeof user === 'string') return { name: user, tag: '' }
  return {
    name: user.name || user.email || '—',
    tag: user.tag ? `@${user.tag}` : user.email ? `@${user.email.split('@')[0]}` : '',
    id: user.id,
  }
}

function StatCard({
  title,
  value,
  sub,
  loading,
}: {
  title: string
  value: string | number
  sub?: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-32" />
            {sub !== undefined && <Skeleton className="h-3.5 w-20" />}
          </div>
        ) : (
          <>
            <p className="text-xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function CryptoPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [cryptoType, setCryptoType] = useState('')
  const [status, setStatus] = useState('')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const router = useRouter()

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(cryptoType ? { cryptoType } : {}),
    ...(status ? { status } : {}),
  }

  const { data: cryptoData, isLoading } = useCryptoTransactions(params)

  const transactions: Transaction[] = cryptoData?.data ?? cryptoData?.transactions ?? cryptoData ?? []
  const total: number = cryptoData?.total ?? cryptoData?.count ?? transactions.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Compute stats
  const stats = useMemo(() => {
    const buyVolume = transactions
      .filter((t) => t.type?.toUpperCase() === 'BUY')
      .reduce((sum, t) => sum + (t.ngnValue ?? t.amount ?? 0), 0)

    const sellVolume = transactions
      .filter((t) => t.type?.toUpperCase() === 'SELL')
      .reduce((sum, t) => sum + (t.ngnValue ?? t.amount ?? 0), 0)

    const platformRevenue = transactions.reduce((sum, t) => sum + (t.revenue ?? 0), 0)

    const coinCount: Record<string, number> = {}
    transactions.forEach((t) => {
      const coin = t.symbol || 'Other'
      coinCount[coin] = (coinCount[coin] ?? 0) + 1
    })
    const mostTraded = Object.entries(coinCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

    const buyRevenue = transactions
      .filter((t) => t.type?.toUpperCase() === 'BUY')
      .reduce((sum, t) => sum + (t.revenue ?? 0), 0)

    const sellRevenue = transactions
      .filter((t) => t.type?.toUpperCase() === 'SELL')
      .reduce((sum, t) => sum + (t.revenue ?? 0), 0)

    return { buyVolume, sellVolume, platformRevenue, mostTraded, buyRevenue, sellRevenue }
  }, [transactions])

  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'user',
      header: 'User',
      cell: ({ row }) => {
        const { name, tag, id } = getUserDisplay(row.original.user)
        return (
          <div
            className={cn('min-w-0', id ? 'cursor-pointer hover:underline' : '')}
            onClick={() => id && router.push(`/users/${id}`)}
          >
            <p className="text-sm font-medium truncate">{name}</p>
            {tag && <p className="text-xs text-muted-foreground truncate">{tag}</p>}
          </div>
        )
      },
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
            cryptoTypeBadgeClass(row.original.type)
          )}
        >
          {row.original.type}
        </span>
      ),
    },
    {
      id: 'symbol',
      header: 'Symbol',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">{row.original.symbol ?? '—'}</span>
      ),
    },
    {
      id: 'cryptoAmount',
      header: 'Amount (Crypto)',
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">
          {row.original.cryptoAmount != null
            ? `${row.original.cryptoAmount.toLocaleString('en', { maximumFractionDigits: 8 })} ${row.original.symbol ?? ''}`
            : '—'}
        </span>
      ),
    },
    {
      id: 'ngnValue',
      header: 'NGN Value',
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-sm">
          {row.original.ngnValue != null
            ? formatCurrency(row.original.ngnValue)
            : formatCurrency(row.original.amount ?? 0)}
        </span>
      ),
    },
    {
      id: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-green-700 dark:text-green-400 font-medium">
          {row.original.revenue != null ? formatCurrency(row.original.revenue) : '—'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
            statusBadgeClass(row.original.status)
          )}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {row.original.createdAt ? formatDate(row.original.createdAt) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          title="View"
          onClick={() => setSelectedTx(row.original)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Crypto Transactions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isLoading ? 'Loading…' : `${total.toLocaleString()} total crypto transactions`}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Buy Volume"
          value={formatCurrency(stats.buyVolume)}
          loading={isLoading}
        />
        <StatCard
          title="Total Sell Volume"
          value={formatCurrency(stats.sellVolume)}
          loading={isLoading}
        />
        <StatCard
          title="Platform Revenue"
          value={formatCurrency(stats.platformRevenue)}
          loading={isLoading}
        />
        <StatCard
          title="Most Traded Coin"
          value={stats.mostTraded}
          loading={isLoading}
        />
      </div>

      {/* Revenue breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Buy Spread Revenue
                </p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(stats.buyRevenue)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Sell Spread Revenue
                </p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(stats.sellRevenue)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Combined Total
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(stats.buyRevenue + stats.sellRevenue)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Reference, symbol…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={cryptoType || 'all'} onValueChange={(v) => { setCryptoType(v == null || v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRYPTO_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value || 'all'} value={o.value || 'all'}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { setSearch(''); setCryptoType(''); setStatus(''); setPage(1) }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columns.length }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  No crypto transactions found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
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
    </div>
  )
}

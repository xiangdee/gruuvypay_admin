'use client'

import React, { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { Search, Copy, Eye, Check } from 'lucide-react'
import toast from 'react-hot-toast'
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

const SERVICE_OPTIONS = [
  { label: 'All Services', value: '' },
  { label: 'Airtime', value: 'airtime' },
  { label: 'Data', value: 'data' },
  { label: 'Electricity', value: 'electricity' },
  { label: 'Cable TV', value: 'cable' },
  { label: 'Betting', value: 'betting' },
]

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Failed', value: 'FAILED' },
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

function getUserDisplay(user: Transaction['user']): { name: string; tag: string; id?: string } {
  if (!user) return { name: '—', tag: '' }
  if (typeof user === 'string') return { name: user, tag: '' }
  return {
    name: user.name || user.email || '—',
    tag: user.tag ? `@${user.tag}` : user.email ? `@${user.email.split('@')[0]}` : '',
    id: user.id,
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-1 inline-flex items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

function StatCard({
  title,
  value,
  loading,
}: {
  title: string
  value: string | number
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-32" />
        ) : (
          <p className="text-xl font-bold text-foreground">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function BillsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [service, setService] = useState('')
  const [status, setStatus] = useState('')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const router = useRouter()

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(service ? { service } : {}),
    ...(status ? { status } : {}),
  }

  const { data: billData, isLoading } = useBillTransactions(params)

  const transactions: Transaction[] = billData?.data ?? billData?.transactions ?? billData ?? []
  const total: number = billData?.total ?? billData?.count ?? transactions.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Compute stats from current page data
  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todayTxs = transactions.filter(
      (t) => t.createdAt && new Date(t.createdAt).toDateString() === today
    )
    const successCount = todayTxs.filter((t) => t.status?.toUpperCase() === 'SUCCESS').length
    const successRate = todayTxs.length > 0 ? Math.round((successCount / todayTxs.length) * 100) : 0

    const categoryCount: Record<string, number> = {}
    transactions.forEach((t) => {
      const s = t.service || 'Other'
      categoryCount[s] = (categoryCount[s] ?? 0) + 1
    })
    const mostPopular = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    const totalVolume = transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0)

    return { todayCount: todayTxs.length, successRate, mostPopular, totalVolume }
  }, [transactions])

  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs truncate max-w-[9rem]" title={row.original.reference}>
            {row.original.reference}
          </span>
          <CopyButton text={row.original.reference} />
        </div>
      ),
    },
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
      id: 'service',
      header: 'Service',
      cell: ({ row }) => (
        <span className="text-sm capitalize">{row.original.service ?? '—'}</span>
      ),
    },
    {
      id: 'provider',
      header: 'Provider',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.provider ?? '—'}</span>
      ),
    },
    {
      id: 'phoneOrMeter',
      header: 'Meter / Phone',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.phoneOrMeter ?? '—'}</span>
      ),
    },
    {
      id: 'electricityToken',
      header: 'Token',
      cell: ({ row }) => {
        const token = row.original.electricityToken
        if (!token) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 text-xs font-mono">
            {token}
          </span>
        )
      },
    },
    {
      id: 'vtpassReference',
      header: 'VTpass Ref',
      cell: ({ row }) => {
        const ref = row.original.vtpassReference
        if (!ref) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs truncate max-w-[8rem]" title={ref}>{ref}</span>
            <CopyButton text={ref} />
          </div>
        )
      },
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-sm">
          {formatCurrency(row.original.amount ?? 0)}
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
        <h1 className="text-2xl font-semibold text-foreground">Bill Payments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isLoading ? 'Loading…' : `${total.toLocaleString()} total bill transactions`}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Bill Payments Today"
          value={stats.todayCount.toLocaleString()}
          loading={isLoading}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          loading={isLoading}
        />
        <StatCard
          title="Most Popular Category"
          value={stats.mostPopular}
          loading={isLoading}
        />
        <StatCard
          title="Total Volume"
          value={formatCurrency(stats.totalVolume)}
          loading={isLoading}
        />
      </div>

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
                  placeholder="Reference, narration…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Service</Label>
              <Select value={service || 'all'} onValueChange={(v) => { setService(v == null || v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map((o) => (
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
                onClick={() => { setSearch(''); setService(''); setStatus(''); setPage(1) }}
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
                  No bill transactions found.
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

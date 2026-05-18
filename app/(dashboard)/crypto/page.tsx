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
import { useCryptoTransactions } from '@/hooks/useTransactions'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

const PAGE_SIZE = 25

// Exact shape from getCryptoTransactions service
// CryptoTransaction Prisma model uses camelCase dates
interface CryptoUser {
  id: string
  firstName: string
  lastName: string
  username: string
}

interface CryptoTransaction {
  id: string
  userId: string
  walletId: string
  symbol: string             // 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'LTC' | 'XRP'
  type: string               // 'BUY' | 'SELL' | 'SEND' | 'RECEIVE' | 'SWAP'
  amount: string             // crypto amount string e.g. "0.00423"
  amountNgn?: string | null  // NGN equivalent raw string e.g. "50000.00" (NOT formatted)
  fee: string
  status: string             // 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED'
  reference: string
  txHash?: string | null
  narration?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string          // camelCase — CryptoTransaction model uses camelCase
  updatedAt: string
  revenueNgn?: string | null // pre-formatted "₦X,XXX.XX" or null — added by service
  user?: CryptoUser
}

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Reversed', value: 'REVERSED' },
]

const CRYPTO_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Buy', value: 'BUY' },
  { label: 'Sell', value: 'SELL' },
  { label: 'Receive', value: 'RECEIVE' },
  { label: 'Send', value: 'SEND' },
  { label: 'Swap', value: 'SWAP' },
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

function cryptoTypeBadgeClass(type: string): string {
  switch (type?.toUpperCase()) {
    case 'BUY': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'SELL': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'RECEIVE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'SEND': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'SWAP': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getUserDisplay(user?: CryptoUser): { name: string; tag: string; id?: string } {
  if (!user) return { name: '—', tag: '' }
  return {
    name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '—',
    tag: user.username ? `@${user.username}` : '',
    id: user.id,
  }
}

function StatCard({ title, value, sub, loading }: { title: string; value: string | number; sub?: string; loading?: boolean }) {
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

// amountNgn is a raw numeric string from DB e.g. "50000.00"
function parseNgn(s?: string | null): number {
  return s ? parseFloat(s) || 0 : 0
}

// revenueNgn is a pre-formatted string "₦X,XXX.XX" added by the service
function parseRevenueNgn(s?: string | null): number {
  if (!s) return 0
  return parseFloat(s.replace(/[₦,]/g, '')) || 0
}

export default function CryptoPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [cryptoType, setCryptoType] = useState('')
  const [status, setStatus] = useState('')
  const router = useRouter()

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(cryptoType ? { type: cryptoType } : {}),
    ...(status ? { status } : {}),
  }

  const { data: cryptoData, isLoading } = useCryptoTransactions(params)

  // API returns { data: CryptoTransaction[], meta: { total, page, limit, pages } }
  const transactions: CryptoTransaction[] = cryptoData?.data ?? []
  const total: number = cryptoData?.meta?.total ?? 0
  const totalPages = cryptoData?.meta?.pages ?? Math.max(1, Math.ceil(total / PAGE_SIZE))

  const stats = useMemo(() => {
    const buyVolume = transactions
      .filter((t) => t.type === 'BUY')
      .reduce((sum, t) => sum + parseNgn(t.amountNgn), 0)

    const sellVolume = transactions
      .filter((t) => t.type === 'SELL')
      .reduce((sum, t) => sum + parseNgn(t.amountNgn), 0)

    const buyRevenue = transactions
      .filter((t) => t.type === 'BUY')
      .reduce((sum, t) => sum + parseRevenueNgn(t.revenueNgn), 0)

    const sellRevenue = transactions
      .filter((t) => t.type === 'SELL')
      .reduce((sum, t) => sum + parseRevenueNgn(t.revenueNgn), 0)

    const coinCount: Record<string, number> = {}
    transactions.forEach((t) => {
      coinCount[t.symbol] = (coinCount[t.symbol] ?? 0) + 1
    })
    const mostTraded = Object.entries(coinCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

    return { buyVolume, sellVolume, buyRevenue, sellRevenue, mostTraded }
  }, [transactions])

  const columns: ColumnDef<CryptoTransaction>[] = [
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
      id: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase', cryptoTypeBadgeClass(row.original.type))}>
          {row.original.type}
        </span>
      ),
    },
    {
      id: 'symbol',
      header: 'Coin',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">{row.original.symbol}</span>
      ),
    },
    {
      id: 'amount',
      header: 'Crypto Amount',
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">
          {row.original.amount} {row.original.symbol}
        </span>
      ),
    },
    {
      id: 'amountNgn',
      header: 'NGN Value',
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-sm">
          {row.original.amountNgn ? formatCurrency(parseNgn(row.original.amountNgn)) : '—'}
        </span>
      ),
    },
    {
      id: 'revenueNgn',
      header: 'Revenue',
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-green-700 dark:text-green-400 font-medium">
          {row.original.revenueNgn ?? '—'}
        </span>
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
          {row.original.createdAt ? formatDate(row.original.createdAt) : '—'}
        </span>
      ),
    },
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: transactions, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Crypto Transactions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isLoading ? 'Loading…' : `${total.toLocaleString()} total`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Buy Volume" value={formatCurrency(stats.buyVolume)} loading={isLoading} />
        <StatCard title="Sell Volume" value={formatCurrency(stats.sellVolume)} loading={isLoading} />
        <StatCard title="Platform Revenue" value={formatCurrency(stats.buyRevenue + stats.sellRevenue)} loading={isLoading} />
        <StatCard title="Most Traded Coin" value={stats.mostTraded} loading={isLoading} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Revenue Breakdown</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="space-y-1"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-6 w-32" /></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Buy Spread (2%)</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(stats.buyRevenue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Sell Spread (1.5%)</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.sellRevenue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Combined Total</p>
                <p className="text-lg font-bold">{formatCurrency(stats.buyRevenue + stats.sellRevenue)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Reference, symbol, tx hash…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-8" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={cryptoType || 'all'} onValueChange={(v) => { setCryptoType(v === 'all' ? '' : (v ?? '')); setPage(1) }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CRYPTO_TYPE_OPTIONS.map((o) => <SelectItem key={o.value || 'all'} value={o.value || 'all'}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setSearch(''); setCryptoType(''); setStatus(''); setPage(1) }}>Reset</Button>
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
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">No crypto transactions found.</TableCell>
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
    </div>
  )
}

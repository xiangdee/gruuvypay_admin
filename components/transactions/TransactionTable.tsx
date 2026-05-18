'use client'
'use no memo'

import React, { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { Copy, Eye, Pencil, Trash2, Check } from 'lucide-react'
import { toast } from 'sonner'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

// Nested user shape from /admin/transactions
interface TxUser {
  id: string
  firstName: string
  lastName: string
  username: string
}

export interface Transaction {
  id: string
  reference: string
  user?: TxUser | string
  type: string
  amount: string       // pre-formatted "₦X,XXX.XX" from API
  fee?: string         // pre-formatted "₦X,XXX.XX"
  amountRaw?: string   // raw kobo value as string
  status: string       // PENDING | SUCCESS | FAILED | REVERSED
  narration?: string
  metadata?: Record<string, unknown>
  created_at?: string  // API uses snake_case
  updated_at?: string
  createdAt?: string   // alias for compatibility
  auditAdmin?: string
  auditAt?: string
}

interface TransactionTableProps {
  data: Transaction[]
  loading?: boolean
  onView?: (tx: Transaction) => void
  onEdit?: (tx: Transaction) => void
  onDelete?: (tx: Transaction) => void
  userRole?: string
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

function getUserDisplay(user: Transaction['user']): { name: string; tag: string; id?: string } {
  if (!user) return { name: '—', tag: '' }
  if (typeof user === 'string') return { name: user, tag: '' }
  return {
    name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '—',
    tag: user.username ? `@${user.username}` : '',
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
      title="Copy reference"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

const SKELETON_COUNT = 8

export default function TransactionTable({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  userRole,
}: TransactionTableProps) {
  const router = useRouter()
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-foreground truncate max-w-[9rem]" title={row.original.reference}>
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
      id: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
            typeBadgeClass(row.original.type)
          )}
        >
          {row.original.type}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-sm">
          {row.original.amount ?? '—'}
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
      cell: ({ row }) => {
        const raw = row.original.created_at ?? row.original.createdAt
        return (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {raw ? formatDate(raw) : '—'}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="icon-sm"
              title="View"
              onClick={() => onView(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {isSuperAdmin && onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Edit"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {isSuperAdmin && onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Delete"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
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
          {loading ? (
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-7 w-20" /></TableCell>
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                No transactions found.
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
  )
}

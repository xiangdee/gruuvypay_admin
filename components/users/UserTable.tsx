'use client'
'use no memo'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { UserStatusBadge } from '@/components/users/UserStatusBadge'
import { formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

// Exact shape from GET /admin/users list — { data: User[], meta: {...} }
export interface User {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  phone: string
  tier: string
  status: string      // 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  onboardingStep: string
  created_at: string  // snake_case from Prisma User model
  wallet: {
    balance: string   // pre-formatted "₦X,XXX.XX" (only balance field in list)
  } | null
}

interface UserTableProps {
  data: User[]
  loading: boolean
  onSuspend: (id: string, reason: string) => void
}

const TIER_STYLES: Record<string, string> = {
  TIER_0: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  TIER_1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  TIER_2: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  TIER_3: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500',
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', TIER_STYLES[tier] ?? TIER_STYLES['TIER_0'])}>
      {tier}
    </span>
  )
}

function UserAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((n) => (n?.[0] ?? '').toUpperCase())
    .join('')
    .slice(0, 2) || '?'
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dbd861] text-xs font-semibold text-white">
      {initials}
    </div>
  )
}

function SuspendDialog({
  open,
  userId,
  userName,
  onClose,
  onConfirm,
}: {
  open: boolean
  userId: string
  userName: string
  onClose: () => void
  onConfirm: (id: string, reason: string) => void
}) {
  const [reason, setReason] = useState('')

  function handleConfirm() {
    if (!reason.trim()) return
    onConfirm(userId, reason.trim())
    setReason('')
    onClose()
  }

  function handleClose() {
    setReason('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Suspend Account</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          You are about to suspend <span className="font-medium text-foreground">{userName}</span>. Please provide a reason.
        </p>
        <Textarea
          placeholder="Reason for suspension..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-24"
        />
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>
            Suspend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const SKELETON_ROWS = 8

export function UserTable({ data, loading, onSuspend }: UserTableProps) {
  const router = useRouter()
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string } | null>(null)

  const columns: ColumnDef<User>[] = [
    {
      id: 'user',
      header: 'User',
      cell: ({ row }) => {
        const u = row.original
        const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
        return (
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar firstName={u.firstName ?? ''} lastName={u.lastName ?? ''} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{fullName || '—'}</p>
              <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string>() || '—'}</span>
      ),
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
      cell: ({ getValue }) => <TierBadge tier={getValue<string>()} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <UserStatusBadge status={getValue<string>()} />,
    },
    {
      id: 'balance',
      header: 'Balance',
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums">
          {row.original.wallet?.balance ?? '—'}
        </span>
      ),
    },
    {
      id: 'joined',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatRelativeDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const u = row.original
        const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => router.push(`/users/${u.id}`)}>
              View
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setSuspendTarget({ id: u.id, name: fullName })}
              disabled={u.status === 'SUSPENDED'}
            >
              Suspend
            </Button>
          </div>
        )
      },
    },
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <div className="rounded-xl border bg-card ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-3.5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Skeleton className="h-7 w-12 rounded-lg" />
                      <Skeleton className="h-7 w-16 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                  No users found.
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

      {suspendTarget && (
        <SuspendDialog
          open={!!suspendTarget}
          userId={suspendTarget.id}
          userName={suspendTarget.name}
          onClose={() => setSuspendTarget(null)}
          onConfirm={onSuspend}
        />
      )}
    </>
  )
}

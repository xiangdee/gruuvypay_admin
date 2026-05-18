'use client'

import type React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatRelativeDate } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Zap } from 'lucide-react'

interface TxUser {
  id: string
  firstName: string
  lastName: string
  username: string
}

interface Transaction {
  id: string
  reference: string
  user?: TxUser
  type: string
  amount: string      // pre-formatted "₦X,XXX.XX"
  status: string      // PENDING | SUCCESS | FAILED | REVERSED
  narration?: string
  created_at: string  // snake_case from Prisma
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  loading?: boolean
}

function getUserInitials(user?: TxUser): string {
  if (!user) return '?'
  const f = user.firstName?.[0] ?? ''
  const l = user.lastName?.[0]  ?? ''
  return (f + l).toUpperCase() || user.username?.[0]?.toUpperCase() || '?'
}

function getUserName(user?: TxUser): string {
  if (!user) return 'Unknown'
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  return name || `@${user.username}` || 'Unknown'
}

const TYPE_CFG: Record<string, { Icon: React.ComponentType<{ className?: string }>; iconColor: string; iconBg: string; amountClass: string }> = {
  DEPOSIT:    { Icon: ArrowDownLeft,  iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10', amountClass: 'text-emerald-600 dark:text-emerald-400' },
  WITHDRAWAL: { Icon: ArrowUpRight,   iconColor: 'text-red-500 dark:text-red-400',         iconBg: 'bg-red-50 dark:bg-red-500/10',         amountClass: 'text-foreground' },
  TRANSFER:   { Icon: ArrowLeftRight, iconColor: 'text-violet-600 dark:text-violet-400',   iconBg: 'bg-violet-50 dark:bg-violet-500/10',   amountClass: 'text-foreground' },
  FEE:        { Icon: Zap,            iconColor: 'text-amber-600 dark:text-amber-400',      iconBg: 'bg-amber-50 dark:bg-amber-500/10',     amountClass: 'text-foreground' },
}

const STATUS_CFG: Record<string, { dot: string; badge: string }> = {
  SUCCESS:  { dot: 'bg-emerald-500', badge: 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  FAILED:   { dot: 'bg-red-500',     badge: 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'                         },
  PENDING:  { dot: 'bg-amber-500',   badge: 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'             },
  REVERSED: { dot: 'bg-violet-500',  badge: 'border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400'       },
}

function StatusPill({ status }: { status: string }) {
  const s = status?.toUpperCase()
  const cfg = STATUS_CFG[s] ?? { dot: 'bg-gray-400', badge: 'border-border bg-muted text-muted-foreground' }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', cfg.badge)}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
      {status}
    </span>
  )
}

export default function RecentTransactions({ transactions, loading = false }: RecentTransactionsProps) {
  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
            <div className="text-right space-y-1.5 shrink-0">
              <Skeleton className="h-3.5 w-20 ml-auto" />
              <Skeleton className="h-4 w-14 ml-auto rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if ((transactions ?? []).length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No transactions yet
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {(transactions ?? []).slice(0, 10).map((tx, i) => {
        const cfg = TYPE_CFG[tx.type?.toUpperCase()] ?? TYPE_CFG['TRANSFER']
        const { Icon, iconColor, iconBg, amountClass } = cfg
        const isCredit = tx.type?.toUpperCase() === 'DEPOSIT'

        return (
          <div key={tx.id ?? i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
            {/* Avatar with type badge */}
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-full bg-[#dbd861]/15 flex items-center justify-center text-xs font-bold text-[#0f0f0f] dark:text-[#dbd861]">
                {getUserInitials(tx.user)}
              </div>
              <div className={cn('absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-background', iconBg)}>
                <Icon className={cn('h-2.5 w-2.5', iconColor)} />
              </div>
            </div>

            {/* Name + narration + date */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate leading-tight">{getUserName(tx.user)}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{tx.narration ?? tx.reference}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{tx.created_at ? formatRelativeDate(tx.created_at) : ''}</p>
            </div>

            {/* Amount + status */}
            <div className="text-right shrink-0">
              <p className={cn('text-sm font-semibold tabular-nums leading-tight', amountClass)}>
                {isCredit ? '+' : ''}{tx.amount}
              </p>
              <div className="mt-1 flex justify-end">
                <StatusPill status={tx.status} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

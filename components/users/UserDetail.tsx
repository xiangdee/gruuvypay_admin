'use client'

import { useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useUser,
  useUserTransactions,
  useSuspendUser,
  useReactivateUser,
  useResetUserPin,
} from '@/hooks/useUsers'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import EditTransactionModal from '@/components/transactions/EditTransactionModal'
import type { Transaction as TxRow } from '@/components/transactions/TransactionTable'
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Mail,
  Phone,
  CalendarDays,
  Wallet,
  ArrowLeftRight,
  Bitcoin,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  XCircle,
  MonitorSmartphone,
  Ban,
  KeyRound,
  RefreshCw,
  Building2,
  CreditCard,
  Layers,
  Globe,
  MapPin,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { UserStatusBadge } from '@/components/users/UserStatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import adminApi from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UserData {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  phone: string
  tier: string
  status: string
  onboardingStep: string
  created_at: string
  wallet?: {
    id: string
    balanceFormatted: string
    ledgerFormatted: string
  } | null
  virtualAccount?: {
    accountNumber: string
    bankName: string
    accountName: string
  } | null
  kyc?: {
    bvnVerified: boolean
    bvnVerifiedAt: string
    ninVerified: boolean
    ninVerifiedAt: string
    addressVerified: boolean
    rejectionReason?: string | null
    addressVerifiedAt: string
  } | null
  deviceSessions?: DeviceSession[]
  pushtokens?: { id: string; deviceOs: string; createdAt: string }[]
  _count?: { transactions: number; cryptoTransactions: number }
  cryptoWallets?: CryptoWallet[]
  cryptoTransactions?: CryptoTx[]
}

interface CryptoWallet {
  symbol: string
  balance: string
}

interface CryptoTx {
  id: string
  reference: string
  type: string
  amountNgn: string
  currency?: string
  status: string
  createdAt: string
}

interface DeviceSession {
  id: string
  isActive: boolean
  lastActivity: string
  deviceName?: string | null
  userAgent?: string | null
  deviceOs?: string | null
  deviceModel?: string | null
  lastIp?: string | null
  location?: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; class: string }> = {
  TIER_0: { label: 'Tier 0', class: 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400 border border-gray-200 dark:border-gray-700' },
  TIER_1: { label: 'Tier 1', class: 'bg-[#dbd861]/15 text-[#9a9300] dark:text-[#dbd861] border border-[#dbd861]/30' },
  TIER_2: { label: 'Tier 2', class: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20' },
  TIER_3: { label: 'Tier 3', class: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' },
}

function TierBadge({ tier }: { tier: string }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG['TIER_0']
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', cfg.class)}>
      {cfg.label}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const s = status?.toUpperCase()
  const color =
    s === 'SUCCESS' ? 'bg-emerald-500' :
    s === 'FAILED'  ? 'bg-red-500' :
    s === 'PENDING' ? 'bg-amber-500' :
    s === 'REVERSED'? 'bg-violet-500' :
    'bg-gray-400'
  const label =
    s === 'SUCCESS' ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' :
    s === 'FAILED'  ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' :
    s === 'PENDING' ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' :
    s === 'REVERSED'? 'text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20' :
    'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium', label)}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', color)} />
      {status}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted/60 border border-border px-2 py-0.5 text-xs font-medium text-foreground/70 font-mono">
      {type}
    </span>
  )
}

function UserAvatar({ name, size = 'lg' }: { name: string | null | undefined; size?: 'sm' | 'lg' | 'xl' }) {
  const initials = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || '?'

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-[#dbd861] font-bold text-[#0f0f0f]',
        size === 'xl' ? 'h-20 w-20 text-2xl' :
        size === 'lg' ? 'h-14 w-14 text-lg' :
        'h-8 w-8 text-xs'
      )}
    >
      {initials}
    </div>
  )
}

// ── Custom Tab Bar ─────────────────────────────────────────────────────────────

interface TabDef {
  id: string
  label: string
  icon: React.ReactNode
}

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-0.5 border-b border-border overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none',
            'after:absolute after:bottom-0 after:inset-x-2 after:h-0.5 after:rounded-t-full after:transition-all',
            active === tab.id
              ? 'text-foreground after:bg-[#dbd861]'
              : 'text-muted-foreground hover:text-foreground after:bg-transparent'
          )}
        >
          <span className={cn('transition-colors', active === tab.id ? 'text-[#dbd861]' : 'text-muted-foreground/60')}>
            {tab.icon}
          </span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Info Row ───────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/60 last:border-0">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="text-sm text-muted-foreground shrink-0 w-28">{label}</span>
      <span className="text-sm font-medium text-foreground truncate flex-1 text-right">{value}</span>
    </div>
  )
}

// ── KYC Check Item ────────────────────────────────────────────────────────────

function KycItem({
  label,
  verified,
  date,
}: {
  label: string
  verified: boolean
  date?: string
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/60 last:border-0">
      {verified ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      )}
      <div className="flex-1">
        <p className={cn('text-sm font-medium', verified ? 'text-foreground' : 'text-muted-foreground')}>
          {label}
        </p>
        {verified && date && (
          <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeDate(date)}</p>
        )}
      </div>
      {verified ? (
        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Verified
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-muted border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Pending
        </span>
      )}
    </div>
  )
}

// ── Suspend Dialog ─────────────────────────────────────────────────────────────

function SuspendAccountDialog({
  open,
  phone,
  onClose,
  onConfirm,
}: {
  open: boolean
  phone: string
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')

  function handleConfirm() {
    if (!reason.trim()) return
    onConfirm(reason.trim())
    setReason('')
  }

  function handleClose() {
    setReason('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-destructive" />
            Suspend Account
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will immediately suspend <span className="font-medium text-foreground">{phone}</span> and block all activity.
        </p>
        <div className="space-y-1.5">
          <Label>Reason for suspension</Label>
          <Textarea
            placeholder="Describe why this account is being suspended..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-24 resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>
            <Ban className="h-4 w-4" />
            Suspend Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Reset PIN Dialog ───────────────────────────────────────────────────────────

function ResetPinDialog({
  open,
  phone,
  onClose,
  onConfirm,
}: {
  open: boolean
  phone: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Reset PIN
          </AlertDialogTitle>
          <AlertDialogDescription>
            Send a PIN Reset OTP to <strong>{phone}</strong>? The user will receive an SMS prompting them to set a new PIN.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Send OTP</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({ user }: { user: UserData }) {
  return (
    <div className="space-y-4">
      {/* Wallet + Account */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="h-4 w-4 text-[#dbd861]" />
              Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 pt-0">
            <div className="mb-4 rounded-xl bg-[#dbd861]/8 border border-[#dbd861]/20 p-4">
              <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {user.wallet?.balanceFormatted ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ledger: <span className="font-medium">{user.wallet?.ledgerFormatted ?? '—'}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-[#dbd861]" />
              Virtual Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 pt-0">
            {user.virtualAccount ? (
              <>
                <InfoRow
                  icon={<CreditCard className="h-3.5 w-3.5" />}
                  label="Account No."
                  value={<span className="font-mono">{user.virtualAccount.accountNumber}</span>}
                />
                <InfoRow
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label="Bank"
                  value={user.virtualAccount.bankName}
                />
                <InfoRow
                  icon={<Wallet className="h-3.5 w-3.5" />}
                  label="Account Name"
                  value={user.virtualAccount.accountName}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No virtual account linked</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KYC Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-[#dbd861]" />
            KYC Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 pt-0">
          <KycItem label="BVN" verified={user.kyc?.bvnVerified ?? false} date={user.kyc?.bvnVerifiedAt} />
          <KycItem label="NIN" verified={user.kyc?.ninVerified ?? false} date={user.kyc?.ninVerifiedAt} />
          <KycItem label="Address Document" verified={user.kyc?.addressVerified ?? false} date={user.kyc?.addressVerifiedAt} />
          {user.kyc?.rejectionReason && (
            <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">Rejection Reason</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">{user.kyc.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Create Transaction Modal ───────────────────────────────────────────────────

const TX_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'FEE'] as const
type TxType = typeof TX_TYPES[number]

function CreateTransactionModal({
  userId,
  open,
  onClose,
  onSuccess,
}: { userId: string; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [type, setType] = useState<TxType>('DEPOSIT')
  const [amountNaira, setAmountNaira] = useState('')
  const [narration, setNarration] = useState('')
  const [loading, setLoading] = useState(false)

  function reset() { setType('DEPOSIT'); setAmountNaira(''); setNarration('') }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(amountNaira)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      await adminApi.post('/admin/transactions', { userId, type, amountNaira: amount, narration })
      toast.success('Transaction created')
      onSuccess()
      onClose()
      reset()
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.message ?? 'Failed to create transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !loading) { onClose(); reset() } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#dbd861]" />
            New Transaction
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TxType)} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TX_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount (₦)</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 5000"
              value={amountNaira}
              onChange={(e) => setAmountNaira(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Narration</Label>
            <Textarea
              placeholder="Manual adjustment by admin"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="min-h-16 resize-none text-sm"
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); reset() }} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amountNaira}>
              <Plus className="h-4 w-4" />
              {loading ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Transactions Tab ───────────────────────────────────────────────────────────

function TransactionsTab({ userId, isSuperAdmin }: { userId: string; isSuperAdmin: boolean }) {
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTx, setEditTx] = useState<TxRow | null>(null)
  const [deleteTx, setDeleteTx] = useState<TxRow | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const queryClient = useQueryClient()
  const deleteMutation = useDeleteTransaction()

  const { data, isLoading } = useUserTransactions(userId, page, 10)
  const transactions: TxRow[] = data?.data ?? []
  const totalPages = data?.meta?.pages ?? 1
  const total = data?.meta?.total ?? 0

  async function handleDelete() {
    if (!deleteTx || deleteConfirm !== 'DELETE') return
    try {
      await deleteMutation.mutateAsync(deleteTx.id)
      toast.success('Transaction deleted')
      queryClient.invalidateQueries({ queryKey: ['user-transactions', userId] })
      setDeleteTx(null)
      setDeleteConfirm('')
    } catch {
      toast.error('Failed to delete transaction')
    }
  }

  const header = (
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-foreground">{total.toLocaleString()} transactions</p>
      {isSuperAdmin && (
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Transaction
        </Button>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <>
        {header}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  if (transactions.length === 0) {
    return (
      <>
        {header}
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        </div>
        <CreateTransactionModal
          userId={userId}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['user-transactions', userId] })}
        />
      </>
    )
  }

  return (
    <>
      {header}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Reference</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Date</th>
              {isSuperAdmin && <th className="px-4 py-3 w-16" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => (
              <tr key={tx.id} className="transition-colors hover:bg-muted/40 group">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.reference}</td>
                <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{tx.amount}</td>
                <td className="px-4 py-3"><StatusDot status={tx.status} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeDate(tx.created_at ?? tx.createdAt)}
                </td>
                {isSuperAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditTx(tx)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { setDeleteTx(tx); setDeleteConfirm('') }}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon-sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <CreateTransactionModal
        userId={userId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['user-transactions', userId] })}
      />

      <EditTransactionModal transaction={editTx} open={!!editTx} onClose={() => setEditTx(null)} />

      <AlertDialog open={!!deleteTx} onOpenChange={(o) => { if (!o) { setDeleteTx(null); setDeleteConfirm('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <span className="font-mono text-foreground">{deleteTx?.reference}</span>.
              Type <strong>DELETE</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE"
            className="font-mono"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteTx(null); setDeleteConfirm('') }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirm !== 'DELETE' || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Crypto Tab ─────────────────────────────────────────────────────────────────

const COIN_COLORS: Record<string, string> = {
  BTC:  'text-orange-500 bg-orange-50 dark:bg-orange-500/10',
  ETH:  'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
  USDT: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
  SOL:  'text-violet-500 bg-violet-50 dark:bg-violet-500/10',
}

function CryptoTab({
  wallets,
  transactions,
}: {
  wallets: CryptoWallet[]
  transactions: CryptoTx[]
}) {
  const COINS = ['BTC', 'ETH', 'USDT', 'SOL']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COINS.map((coin) => {
          const w = wallets?.find((x) => x.symbol === coin)
          const color = COIN_COLORS[coin] ?? 'text-foreground bg-muted'
          return (
            <div key={coin} className="rounded-xl border border-border bg-card p-4">
              <div className={cn('mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold', color)}>
                {coin.slice(0, 1)}
              </div>
              <p className="text-xs font-medium text-muted-foreground">{coin}</p>
              <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                {w?.balance ?? '0.00'}
              </p>
            </div>
          )
        })}
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border">
          <Bitcoin className="h-6 w-6 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No crypto transactions yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Reference', 'Type', 'Amount', 'Currency', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => (
                <tr key={tx.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.reference}</td>
                  <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{tx.amountNgn}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tx.currency ?? '—'}</td>
                  <td className="px-4 py-3"><StatusDot status={tx.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeDate(tx.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── KYC Tab ────────────────────────────────────────────────────────────────────

type KycDoc = 'bvn' | 'nin' | 'address'

function KycTab({ user, isSuperAdmin }: { user: UserData; isSuperAdmin: boolean }) {
  const queryClient = useQueryClient()
  const [overrideDoc, setOverrideDoc] = useState<KycDoc | null>(null)
  const [overrideAction, setOverrideAction] = useState<'approve' | 'reject'>('approve')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideLoading, setOverrideLoading] = useState(false)

  const [editKycOpen, setEditKycOpen] = useState(false)
  const [editKycLoading, setEditKycLoading] = useState(false)
  const [editKycFields, setEditKycFields] = useState({
    bvn: '', nin: '', address: '', city: '', state: '', addressDocType: '',
  })

  const kycVerifiedCount = [
    user.kyc?.bvnVerified,
    user.kyc?.ninVerified,
    user.kyc?.addressVerified,
  ].filter(Boolean).length

  async function handleOverride() {
    if (!overrideDoc) return
    if (overrideAction === 'reject' && !overrideReason.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    setOverrideLoading(true)
    try {
      await adminApi.post(`/admin/kyc/${user.id}/${overrideDoc}`, {
        action: overrideAction,
        ...(overrideAction === 'reject' ? { reason: overrideReason.trim() } : {}),
      })
      toast.success(`${overrideDoc.toUpperCase()} ${overrideAction}d`)
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      setOverrideDoc(null)
      setOverrideReason('')
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.message ?? 'Override failed')
    } finally {
      setOverrideLoading(false)
    }
  }

  async function handleEditKyc() {
    const payload: Record<string, string> = {}
    if (editKycFields.bvn.trim())            payload.bvn            = editKycFields.bvn.trim()
    if (editKycFields.nin.trim())            payload.nin            = editKycFields.nin.trim()
    if (editKycFields.address.trim())        payload.address        = editKycFields.address.trim()
    if (editKycFields.city.trim())           payload.city           = editKycFields.city.trim()
    if (editKycFields.state.trim())          payload.state          = editKycFields.state.trim()
    if (editKycFields.addressDocType.trim()) payload.addressDocType = editKycFields.addressDocType.trim()

    if (Object.keys(payload).length === 0) {
      toast.error('Enter at least one field to update')
      return
    }
    setEditKycLoading(true)
    try {
      await adminApi.patch(`/admin/kyc/${user.id}`, payload)
      toast.success('KYC data updated')
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      setEditKycOpen(false)
      setEditKycFields({ bvn: '', nin: '', address: '', city: '', state: '', addressDocType: '' })
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.message ?? 'Update failed')
    } finally {
      setEditKycLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Verification Progress</p>
          <span className={cn(
            'text-sm font-semibold tabular-nums',
            kycVerifiedCount === 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
          )}>
            {kycVerifiedCount}/3 verified
          </span>
        </div>
        <div className="flex gap-1.5 h-1.5">
          {[0, 1, 2].map((i) => {
            const verified = [
              user.kyc?.bvnVerified,
              user.kyc?.ninVerified,
              user.kyc?.addressVerified,
            ][i]
            return (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-full transition-colors',
                  verified ? 'bg-emerald-500' : 'bg-muted'
                )}
              />
            )
          })}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-[#dbd861]" />
            Identity Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-0">
          <KycItem label="BVN Verification" verified={user.kyc?.bvnVerified ?? false} date={user.kyc?.bvnVerifiedAt} />
          <KycItem label="NIN Verification" verified={user.kyc?.ninVerified ?? false} date={user.kyc?.ninVerifiedAt} />
          <KycItem label="Address Document" verified={user.kyc?.addressVerified ?? false} date={user.kyc?.addressVerifiedAt} />
        </CardContent>
      </Card>

      {user.kyc?.rejectionReason && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">Rejection Reason</p>
          <p className="text-sm text-red-600 dark:text-red-300">{user.kyc.rejectionReason}</p>
        </div>
      )}

      {isSuperAdmin && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Manual Override</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Manually approve or reject a KYC document. Use with caution — this bypasses the normal verification flow.
            </p>
            <div className="flex flex-wrap gap-2">
              {(['bvn', 'nin', 'address'] as KycDoc[]).map((doc) => (
                <Button
                  key={doc}
                  variant="outline"
                  size="sm"
                  onClick={() => { setOverrideDoc(doc); setOverrideAction('approve'); setOverrideReason('') }}
                >
                  Override {doc.toUpperCase()}
                </Button>
              ))}
            </div>
            <div className="pt-3 mt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                Edit the raw KYC data the user submitted (BVN, NIN, address).
                Only fill in fields you want to change.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditKycOpen(true); setEditKycFields({ bvn: '', nin: '', address: '', city: '', state: '', addressDocType: '' }) }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit KYC Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit KYC data dialog */}
      <Dialog open={editKycOpen} onOpenChange={(o) => { if (!o) setEditKycOpen(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit KYC Data</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">
            Leave fields blank to keep existing values. BVN and NIN will be re-encrypted.
          </p>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">BVN</Label>
                <Input
                  placeholder="11-digit BVN"
                  maxLength={11}
                  value={editKycFields.bvn}
                  onChange={(e) => setEditKycFields((p) => ({ ...p, bvn: e.target.value }))}
                  disabled={editKycLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">NIN</Label>
                <Input
                  placeholder="11-digit NIN"
                  maxLength={11}
                  value={editKycFields.nin}
                  onChange={(e) => setEditKycFields((p) => ({ ...p, nin: e.target.value }))}
                  disabled={editKycLoading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Input
                placeholder="Street address"
                value={editKycFields.address}
                onChange={(e) => setEditKycFields((p) => ({ ...p, address: e.target.value }))}
                disabled={editKycLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input
                  placeholder="City"
                  value={editKycFields.city}
                  onChange={(e) => setEditKycFields((p) => ({ ...p, city: e.target.value }))}
                  disabled={editKycLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Input
                  placeholder="State"
                  value={editKycFields.state}
                  onChange={(e) => setEditKycFields((p) => ({ ...p, state: e.target.value }))}
                  disabled={editKycLoading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address Doc Type</Label>
              <Input
                placeholder="e.g. utility_bill, bank_statement"
                value={editKycFields.addressDocType}
                onChange={(e) => setEditKycFields((p) => ({ ...p, addressDocType: e.target.value }))}
                disabled={editKycLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditKycOpen(false)} disabled={editKycLoading}>
              Cancel
            </Button>
            <Button onClick={handleEditKyc} disabled={editKycLoading}>
              {editKycLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC override dialog */}
      <Dialog open={!!overrideDoc} onOpenChange={(o) => { if (!o) { setOverrideDoc(null); setOverrideReason('') } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Override {overrideDoc?.toUpperCase()} Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['approve', 'reject'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setOverrideAction(a)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium capitalize transition-colors',
                    overrideAction === a
                      ? a === 'approve'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-destructive text-destructive-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            {overrideAction === 'reject' && (
              <div className="space-y-1.5">
                <Label>Rejection reason</Label>
                <Textarea
                  placeholder="Explain why this document is being rejected…"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="min-h-20 resize-none text-sm"
                  disabled={overrideLoading}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOverrideDoc(null); setOverrideReason('') }} disabled={overrideLoading}>
              Cancel
            </Button>
            <Button
              variant={overrideAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleOverride}
              disabled={overrideLoading || (overrideAction === 'reject' && !overrideReason.trim())}
            >
              {overrideLoading ? 'Saving…' : `${overrideAction === 'approve' ? 'Approve' : 'Reject'} ${overrideDoc?.toUpperCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Sessions Tab ───────────────────────────────────────────────────────────────

function getDeviceLabel(session: DeviceSession): string {
  if (session.deviceName) return session.deviceName
  if (session.deviceOs) return `${session.deviceOs}${session.deviceModel ? ` · ${session.deviceModel}` : ''}`
  if (session.userAgent) return session.userAgent.slice(0, 50)
  return 'Unknown Device'
}

function SessionsTab({ sessions }: { sessions: DeviceSession[] }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border">
        <Smartphone className="h-6 w-6 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No active sessions</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
            <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground truncate">
                {getDeviceLabel(s)}
              </p>
              {s.isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide shrink-0">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  Active
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {s.lastIp && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {s.lastIp}
                </span>
              )}
              {s.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {s.location}
                </span>
              )}
              <span>Last seen {formatRelativeDate(s.lastActivity)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile hero skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="flex-1 space-y-3 w-full">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="flex gap-6 shrink-0">
              {[0, 1, 2].map((i) => (
                <div key={i} className="text-center space-y-1">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-x-8 gap-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-4 w-40" />)}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Skeleton className="h-48 rounded-xl" />
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-10 w-full rounded-none" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { id: 'overview',     label: 'Overview',     icon: <Layers className="h-3.5 w-3.5" /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight className="h-3.5 w-3.5" /> },
  { id: 'crypto',       label: 'Crypto',       icon: <Bitcoin className="h-3.5 w-3.5" /> },
  { id: 'kyc',          label: 'KYC',          icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { id: 'sessions',     label: 'Sessions',     icon: <Smartphone className="h-3.5 w-3.5" /> },
]

interface UserDetailProps {
  userId: string
}

export function UserDetail({ userId }: UserDetailProps) {
  const admin = useAdmin()
  const role = admin?.role
  const isSupportPlus = role === 'SUPER_ADMIN' || role === 'SUPPORT'
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const { data, isLoading, error } = useUser(userId)
  const suspendMutation = useSuspendUser()
  const reactivateMutation = useReactivateUser()
  const resetPinMutation = useResetUserPin()

  const [suspendOpen, setSuspendOpen] = useState(false)
  const [resetPinOpen, setResetPinOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const user: UserData | undefined = data as UserData | undefined

  function handleSuspend(reason: string) {
    setSuspendOpen(false)
    toast.promise(
      suspendMutation.mutateAsync({ id: userId, reason }),
      {
        loading: 'Suspending account…',
        success: 'Account suspended.',
        error: (err) => err?.response?.data?.message ?? 'Failed to suspend account.',
      }
    )
  }

  function handleReactivate() {
    toast.promise(
      reactivateMutation.mutateAsync(userId),
      {
        loading: 'Reactivating account…',
        success: 'Account reactivated.',
        error: (err) => err?.response?.data?.message ?? 'Failed to reactivate account.',
      }
    )
  }

  function handleResetPin() {
    setResetPinOpen(false)
    toast.promise(
      resetPinMutation.mutateAsync(userId),
      {
        loading: 'Sending PIN reset OTP…',
        success: 'PIN reset OTP sent.',
        error: (err) => err?.response?.data?.message ?? 'Failed to send PIN reset OTP.',
      }
    )
  }

  if (isLoading) return <UserDetailSkeleton />

  if (error || !user) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <XCircle className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          {error ? 'Failed to load user.' : 'User not found.'}
        </p>
      </div>
    )
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim()

  return (
    <>
      <div className="space-y-6">

        {/* ── Profile Hero ── */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Avatar */}
              <UserAvatar name={fullName} size="xl" />

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground">{fullName || '—'}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">@{user.username}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <TierBadge tier={user.tier} />
                  <UserStatusBadge status={user.status} />
                </div>
              </div>

              {/* Key metrics */}
              <div className="flex items-center gap-6 shrink-0 pt-1 sm:pt-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground tabular-nums leading-none">
                    {user.wallet?.balanceFormatted ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Balance</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground tabular-nums leading-none">
                    {user._count?.transactions ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Transactions</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground tabular-nums leading-none">
                    {user.deviceSessions?.length ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Sessions</p>
                </div>
              </div>
            </div>

            {/* Contact row */}
            <div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {user.phone}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                Joined {formatDate(user.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Body ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">

          {/* Actions sidebar */}
          {isSupportPlus && (
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {user.status !== 'SUSPENDED' ? (
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => setSuspendOpen(true)}
                      disabled={suspendMutation.isPending}
                    >
                      <Ban className="h-4 w-4" />
                      Suspend Account
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleReactivate}
                      disabled={reactivateMutation.isPending}
                    >
                      <RefreshCw className="h-4 w-4" />
                      {reactivateMutation.isPending ? 'Reactivating…' : 'Reactivate Account'}
                    </Button>
                  )}
                  {isSuperAdmin && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setResetPinOpen(true)}
                      disabled={resetPinMutation.isPending}
                    >
                      <KeyRound className="h-4 w-4" />
                      Reset PIN
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Quick info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Account Info</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-0">
                  <InfoRow
                    icon={<Layers className="h-3.5 w-3.5" />}
                    label="Onboarding"
                    value={user.onboardingStep ?? '—'}
                  />
                  <InfoRow
                    icon={<Smartphone className="h-3.5 w-3.5" />}
                    label="Push Tokens"
                    value={String(user.pushtokens?.length ?? 0)}
                  />
                  <InfoRow
                    icon={<Bitcoin className="h-3.5 w-3.5" />}
                    label="Crypto Txns"
                    value={String(user._count?.cryptoTransactions ?? '—')}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs panel */}
          <div className={cn(isSupportPlus ? 'lg:col-span-3' : 'lg:col-span-4')}>
            <Card>
              <CardContent className="p-0">
                <div className="px-4 pt-4">
                  <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
                </div>
                <div className="p-4 pt-5">
                  {activeTab === 'overview' && <OverviewTab user={user} />}
                  {activeTab === 'transactions' && <TransactionsTab userId={userId} isSuperAdmin={isSuperAdmin} />}
                  {activeTab === 'crypto' && (
                    <CryptoTab
                      wallets={user.cryptoWallets ?? []}
                      transactions={user.cryptoTransactions ?? []}
                    />
                  )}
                  {activeTab === 'kyc' && <KycTab user={user} isSuperAdmin={isSuperAdmin} />}
                  {activeTab === 'sessions' && <SessionsTab sessions={user.deviceSessions ?? []} />}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SuspendAccountDialog
        open={suspendOpen}
        phone={user.phone}
        onClose={() => setSuspendOpen(false)}
        onConfirm={handleSuspend}
      />

      <ResetPinDialog
        open={resetPinOpen}
        phone={user.phone}
        onClose={() => setResetPinOpen(false)}
        onConfirm={handleResetPin}
      />
    </>
  )
}

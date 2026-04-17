'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import {
  useUser,
  useSuspendUser,
  useReactivateUser,
  useResetUserPin,
} from '@/hooks/useUsers'
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { UserStatusBadge } from '@/components/users/UserStatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserData {
  id: string
  name: string
  username: string
  email: string
  phone: string
  tier: string
  status: string
  createdAt: string
  wallet?: {
    balance: number
    nuban?: string
  }
  quidaxSubAccountId?: string
  kyc?: {
    bvnVerified: boolean
    bvnVerifiedAt?: string
    ninVerified: boolean
    ninVerifiedAt?: string
    addressVerified: boolean
    addressVerifiedAt?: string
  }
  pushTokensCount?: number
  transactions?: Transaction[]
  cryptoWallets?: CryptoWallet[]
  cryptoTransactions?: CryptoTx[]
  sessions?: Session[]
}

interface Transaction {
  id: string
  reference: string
  type: string
  amount: number
  status: string
  createdAt: string
}

interface CryptoWallet {
  currency: string
  balance: string
}

interface CryptoTx {
  id: string
  reference: string
  type: string
  amount: string
  currency: string
  status: string
  createdAt: string
}

interface Session {
  id: string
  device: string
  ip: string
  lastSeen: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TIER_STYLES: Record<string, string> = {
  TIER_0: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  TIER_1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  TIER_2: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  TIER_3: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500',
}

function TierBadge({ tier }: { tier: string }) {
  const styles = TIER_STYLES[tier] ?? TIER_STYLES['TIER_0']
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        styles
      )}
    >
      {tier}
    </span>
  )
}

function TransactionTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      {type}
    </span>
  )
}

function TransactionStatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase()
  const styles =
    s === 'SUCCESS'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : s === 'FAILED'
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : s === 'PENDING'
          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', styles)}>
      {status}
    </span>
  )
}

function KycFlag({ label, verified, date }: { label: string; verified: boolean; date?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            verified
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400'
          )}
        >
          {verified ? 'Verified' : 'Not verified'}
        </span>
        {verified && date && (
          <p className="mt-0.5 text-xs text-muted-foreground">{formatRelativeDate(date)}</p>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right break-all">{value}</span>
    </div>
  )
}

function UserAvatar({ name, size = 'lg' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white',
        size === 'lg' ? 'h-16 w-16 text-xl' : 'h-8 w-8 text-xs'
      )}
    >
      {initials}
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
          <DialogTitle>Suspend Account</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will immediately suspend <span className="font-medium text-foreground">{phone}</span> and block all activity.
        </p>
        <Textarea
          placeholder="Reason for suspension (required)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-24"
        />
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
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
          <AlertDialogTitle>Reset PIN</AlertDialogTitle>
          <AlertDialogDescription>
            Send PIN Reset OTP to {phone}? This will send an SMS to the user&apos;s registered phone number prompting them to set a new PIN.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Send</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({ user }: { user: UserData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoRow label="Balance" value={formatCurrency(user.wallet?.balance ?? 0)} />
          <InfoRow label="Virtual NUBAN" value={user.wallet?.nuban ?? '—'} />
          <InfoRow label="Quidax Sub-account" value={user.quidaxSubAccountId ?? '—'} />
          <InfoRow label="Push Tokens" value={String(user.pushTokensCount ?? 0)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">KYC Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <KycFlag
            label="BVN Verified"
            verified={user.kyc?.bvnVerified ?? false}
            date={user.kyc?.bvnVerifiedAt}
          />
          <KycFlag
            label="NIN Verified"
            verified={user.kyc?.ninVerified ?? false}
            date={user.kyc?.ninVerifiedAt}
          />
          <KycFlag
            label="Address Verified"
            verified={user.kyc?.addressVerified ?? false}
            date={user.kyc?.addressVerifiedAt}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Transactions Tab ───────────────────────────────────────────────────────────

function TransactionsTab({ transactions }: { transactions: Transaction[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-muted-foreground">No transactions yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card ring-1 ring-foreground/10 overflow-hidden">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b">
            {['Reference', 'Type', 'Amount', 'Status', 'Date'].map((h) => (
              <th
                key={h}
                className="h-10 px-3 text-left align-middle font-medium text-foreground whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
              <td className="px-3 py-2 font-mono text-xs">{tx.reference}</td>
              <td className="px-3 py-2"><TransactionTypeBadge type={tx.type} /></td>
              <td className="px-3 py-2 font-medium tabular-nums">{formatCurrency(tx.amount)}</td>
              <td className="px-3 py-2"><TransactionStatusBadge status={tx.status} /></td>
              <td className="px-3 py-2 text-muted-foreground">{formatRelativeDate(tx.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Crypto Tab ─────────────────────────────────────────────────────────────────

function CryptoTab({
  wallets,
  transactions,
}: {
  wallets: CryptoWallet[]
  transactions: CryptoTx[]
}) {
  const COINS = ['BTC', 'ETH', 'USDT', 'SOL']

  return (
    <div className="space-y-6">
      {/* Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Crypto Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COINS.map((coin) => {
              const w = wallets?.find((x) => x.currency === coin)
              return (
                <div key={coin} className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">{coin}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {w?.balance ?? '0.00'}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Crypto transactions */}
      {!transactions || transactions.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">No crypto transactions yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card ring-1 ring-foreground/10 overflow-hidden">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b">
                {['Reference', 'Type', 'Amount', 'Currency', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className="h-10 px-3 text-left align-middle font-medium text-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="px-3 py-2 font-mono text-xs">{tx.reference}</td>
                  <td className="px-3 py-2"><TransactionTypeBadge type={tx.type} /></td>
                  <td className="px-3 py-2 font-medium tabular-nums">{tx.amount}</td>
                  <td className="px-3 py-2 text-muted-foreground">{tx.currency}</td>
                  <td className="px-3 py-2"><TransactionStatusBadge status={tx.status} /></td>
                  <td className="px-3 py-2 text-muted-foreground">{formatRelativeDate(tx.createdAt)}</td>
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

function KycTab({ user, isSuperAdmin }: { user: UserData; isSuperAdmin: boolean }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Identity Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <KycFlag
            label="BVN Verified"
            verified={user.kyc?.bvnVerified ?? false}
            date={user.kyc?.bvnVerifiedAt}
          />
          <KycFlag
            label="NIN Verified"
            verified={user.kyc?.ninVerified ?? false}
            date={user.kyc?.ninVerifiedAt}
          />
          <KycFlag
            label="Address Document"
            verified={user.kyc?.addressVerified ?? false}
            date={user.kyc?.addressVerifiedAt}
          />
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Manual Override</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Override KYC verification status manually. Use with caution.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">Override BVN</Button>
              <Button variant="outline" size="sm">Override NIN</Button>
              <Button variant="outline" size="sm">Override Address</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Sessions Tab ───────────────────────────────────────────────────────────────

function SessionsTab({ sessions }: { sessions: Session[] }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-muted-foreground">No active sessions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 ring-1 ring-foreground/10"
        >
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-foreground truncate">{s.device}</p>
            <p className="text-xs text-muted-foreground">{s.ip}</p>
            <p className="text-xs text-muted-foreground">Last seen {formatRelativeDate(s.lastSeen)}</p>
          </div>
          <Button variant="destructive" size="sm" className="shrink-0">
            Revoke
          </Button>
        </div>
      ))}
    </div>
  )
}

// ── Profile Skeleton ───────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <Card className="h-fit">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-3 pb-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 text-center">
            <Skeleton className="h-5 w-36 mx-auto" />
            <Skeleton className="h-4 w-28 mx-auto" />
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface UserDetailProps {
  userId: string
}

export function UserDetail({ userId }: UserDetailProps) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const isSupportPlus = role === 'SUPER_ADMIN' || role === 'SUPPORT'
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const { data, isLoading, error } = useUser(userId)
  const suspendMutation = useSuspendUser()
  const reactivateMutation = useReactivateUser()
  const resetPinMutation = useResetUserPin()

  const [suspendOpen, setSuspendOpen] = useState(false)
  const [resetPinOpen, setResetPinOpen] = useState(false)

  const user: UserData | undefined = data?.data ?? data?.user ?? data

  function handleSuspend(reason: string) {
    setSuspendOpen(false)
    toast.promise(
      suspendMutation.mutateAsync({ id: userId, reason }),
      {
        loading: 'Suspending account...',
        success: 'Account suspended.',
        error: (err) => err?.response?.data?.message ?? 'Failed to suspend account.',
      }
    )
  }

  function handleReactivate() {
    toast.promise(
      reactivateMutation.mutateAsync(userId),
      {
        loading: 'Reactivating account...',
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
        loading: 'Sending PIN reset OTP...',
        success: 'PIN reset OTP sent.',
        error: (err) => err?.response?.data?.message ?? 'Failed to send PIN reset OTP.',
      }
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProfileSkeleton />
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {error ? 'Failed to load user.' : 'User not found.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left: Profile card ── */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center gap-3 pb-6 text-center">
                <UserAvatar name={user.name} size="lg" />
                <div>
                  <h2 className="text-base font-semibold text-foreground">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <TierBadge tier={user.tier} />
                  <UserStatusBadge status={user.status} />
                </div>
              </div>

              {/* Info rows */}
              <div className="border-t pt-4 space-y-0">
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Phone" value={user.phone} />
                <InfoRow label="Joined" value={formatDate(user.createdAt)} />
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          {isSupportPlus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.status !== 'suspended' && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setSuspendOpen(true)}
                    disabled={suspendMutation.isPending}
                  >
                    Suspend Account
                  </Button>
                )}
                {user.status === 'suspended' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleReactivate}
                    disabled={reactivateMutation.isPending}
                  >
                    Reactivate Account
                  </Button>
                )}
                {isSuperAdmin && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setResetPinOpen(true)}
                    disabled={resetPinMutation.isPending}
                  >
                    Reset PIN
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Tabs ── */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList variant="line" className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab user={user} />
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionsTab transactions={user.transactions ?? []} />
            </TabsContent>

            <TabsContent value="crypto">
              <CryptoTab
                wallets={user.cryptoWallets ?? []}
                transactions={user.cryptoTransactions ?? []}
              />
            </TabsContent>

            <TabsContent value="kyc">
              <KycTab user={user} isSuperAdmin={isSuperAdmin} />
            </TabsContent>

            <TabsContent value="sessions">
              <SessionsTab sessions={user.sessions ?? []} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
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

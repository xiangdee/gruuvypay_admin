'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useKycQueue, useKycStats } from '@/hooks/useFinance'
import adminApi from '@/lib/api'
import { formatDate, formatRelativeDate, cn } from '@/lib/utils'

interface KycUser {
  id: string
  firstName: string
  lastName: string
  email: string
  username: string
  tier: string
  phone: string
}

interface KycEntry {
  id: string
  userId: string
  fincraStatus: string
  bvnVerified: boolean
  ninVerified: boolean
  addressVerified: boolean
  submittedAt: string
  updatedAt: string
  user: KycUser
}

type DocType = 'bvn' | 'nin' | 'address'

const DOC_TYPES: { key: DocType; label: string; tierOnApprove: string }[] = [
  { key: 'bvn', label: 'BVN', tierOnApprove: 'TIER_1' },
  { key: 'nin', label: 'NIN + Utility', tierOnApprove: 'TIER_2' },
  { key: 'address', label: 'Address', tierOnApprove: 'TIER_3' },
]

function isDocVerified(entry: KycEntry, doc: DocType): boolean {
  if (doc === 'bvn') return entry.bvnVerified
  if (doc === 'nin') return entry.ninVerified
  return entry.addressVerified
}

function firstPendingDoc(entry: KycEntry): DocType {
  if (!entry.bvnVerified) return 'bvn'
  if (!entry.ninVerified) return 'nin'
  return 'address'
}

function getTierVariant(tier: string) {
  if (tier === 'TIER_3' || tier === 'TIER_2') return 'default'
  if (tier === 'TIER_1') return 'secondary'
  return 'outline'
}

function VerificationBadges({ entry }: { entry: KycEntry }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {(['bvn', 'nin', 'address'] as DocType[]).map((doc) => {
        const verified = isDocVerified(entry, doc)
        const label = doc === 'bvn' ? 'BVN' : doc === 'nin' ? 'NIN' : 'Addr'
        return (
          <span key={doc} className={cn(
            'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border',
            verified
              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
          )}>
            {label} {verified ? '✓' : '○'}
          </span>
        )
      })}
    </div>
  )
}

interface ReviewModalProps {
  entry: KycEntry | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function ReviewModal({ entry, open, onClose, onSuccess }: ReviewModalProps) {
  const [selectedDoc, setSelectedDoc] = useState<DocType>('bvn')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  // Default to first unverified doc when entry changes
  useEffect(() => {
    if (entry) {
      setSelectedDoc(firstPendingDoc(entry))
      setReason('')
    }
  }, [entry?.userId])

  const currentlyVerified = entry ? isDocVerified(entry, selectedDoc) : false
  const isDowngrade = currentlyVerified  // rejecting an already-verified doc

  async function submit(action: 'approve' | 'reject') {
    if (!entry) return
    if (action === 'reject' && !reason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    setLoading(true)
    try {
      await adminApi.post(`/admin/kyc/${entry.userId}/${selectedDoc}`, {
        action,
        ...(action === 'reject' ? { reason: reason.trim() } : {}),
      })
      const docInfo = DOC_TYPES.find((d) => d.key === selectedDoc)!
      if (action === 'approve') {
        toast.success(`${docInfo.label} approved — user upgraded to ${docInfo.tierOnApprove}`)
      } else {
        toast.success(`${docInfo.label} rejected${isDowngrade ? ' — tier downgraded' : ''}`)
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.message ?? `Failed to ${action}`)
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      setReason('')
      onClose()
    }
  }

  if (!entry) return null

  const docInfo = DOC_TYPES.find((d) => d.key === selectedDoc)!

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>KYC Override</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User info */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{entry.user.firstName} {entry.user.lastName}</p>
              <Badge variant={getTierVariant(entry.user.tier)}>{entry.user.tier}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">@{entry.user.username} &middot; {entry.user.email}</p>
          </div>

          {/* Document type selector */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Document to Review
            </p>
            <div className="flex gap-2">
              {DOC_TYPES.map(({ key, label }) => {
                const verified = isDocVerified(entry, key)
                return (
                  <button
                    key={key}
                    onClick={() => { setSelectedDoc(key); setReason('') }}
                    disabled={loading}
                    className={cn(
                      'flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                      selectedDoc === key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    <div className="text-center space-y-0.5">
                      <p>{label}</p>
                      <p className={cn('text-[10px]', verified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400')}>
                        {verified ? '✓ Verified' : '○ Pending'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Downgrade warning */}
          {isDowngrade && (
            <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700 dark:text-orange-400">
                <span className="font-semibold">Downgrade:</span> Rejecting an already-verified {docInfo.label} will revoke this verification and lower the user&apos;s KYC tier.
              </p>
            </div>
          )}

          {/* Info row */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Submitted</span>
            <span className="font-medium text-right">{formatDate(entry.submittedAt)}</span>
            <span className="text-muted-foreground">Fincra status</span>
            <span className="font-mono text-xs text-right">{entry.fincraStatus}</span>
            {!isDowngrade && (
              <>
                <span className="text-muted-foreground">Approving upgrades to</span>
                <span className="font-medium text-right">{docInfo.tierOnApprove}</span>
              </>
            )}
          </div>

          {/* Reason — always shown, required for reject */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Reason {isDowngrade ? '(required)' : '(required to reject)'}
            </label>
            <Textarea
              placeholder={isDowngrade
                ? 'Why is this verification being revoked?'
                : 'Explain why this submission is being rejected...'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20 text-sm"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            onClick={() => submit('reject')}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <XCircle className="h-4 w-4" />
            {isDowngrade ? 'Revoke' : 'Reject'}
          </Button>
          <Button
            onClick={() => submit('approve')}
            disabled={loading || isDowngrade}
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white border-transparent disabled:opacity-40"
            title={isDowngrade ? 'Already verified — use Revoke to downgrade' : undefined}
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function KycPage() {
  const queryClient = useQueryClient()
  const { data: kycData, isLoading } = useKycQueue({ limit: 100 })
  const { data: statsData, isLoading: statsLoading } = useKycStats()

  const [selectedEntry, setSelectedEntry] = useState<KycEntry | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const entries: KycEntry[] = kycData?.data ?? []
  const pendingCount: number = statsData?.pending ?? 0
  const approvedToday: number = statsData?.approvedToday ?? 0
  const rejectedToday: number = statsData?.rejectedToday ?? 0

  const sorted = [...entries].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  )

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['kyc'] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KYC Review Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review, approve, reject, or downgrade identity verifications
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500 shrink-0" />
            <div>
              {statsLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{pendingCount}</p>}
              <p className="text-xs text-muted-foreground">Pending Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
            <div>
              {statsLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{approvedToday}</p>}
              <p className="text-xs text-muted-foreground">Approved Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500 shrink-0" />
            <div>
              {statsLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{rejectedToday}</p>}
              <p className="text-xs text-muted-foreground">Rejected Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No KYC submissions found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Verifications</TableHead>
                  <TableHead>Fincra</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{entry.user.firstName} {entry.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">@{entry.user.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTierVariant(entry.user.tier)} className="text-xs">
                        {entry.user.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <VerificationBadges entry={entry} />
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">{entry.fincraStatus}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">{formatDate(entry.submittedAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeDate(entry.submittedAt)}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Always enabled — supports both upgrade and downgrade */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedEntry(entry); setModalOpen(true) }}
                      >
                        Override
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReviewModal
        entry={selectedEntry}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

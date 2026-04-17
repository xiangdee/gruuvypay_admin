'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useKycQueue } from '@/hooks/useFinance'
import adminApi from '@/lib/api'
import { formatDate, formatRelativeDate } from '@/lib/utils'

interface KycEntry {
  id: string
  user: {
    id: string
    name: string
    tag: string
    tier: string
  }
  type: 'BVN' | 'NIN' | 'Address'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: string
  fincraStatus: string
  fincraResult?: Record<string, unknown>
}

function getTierVariant(tier: string) {
  switch (tier) {
    case 'TIER_0':
      return 'outline'
    case 'TIER_1':
      return 'secondary'
    case 'TIER_2':
      return 'default'
    case 'TIER_3':
      return 'default'
    default:
      return 'outline'
  }
}

function StatusBadge({ status }: { status: KycEntry['status'] }) {
  const map = {
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' },
    APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400' },
  }
  const { label, className } = map[status] ?? map['PENDING']
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

interface ReviewModalProps {
  entry: KycEntry | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function ReviewModal({ entry, open, onClose, onSuccess }: ReviewModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    if (!entry) return
    setLoading(true)
    try {
      await adminApi.post(`/admin/kyc/${entry.id}/approve`)
      toast.success('KYC submission approved')
      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to approve. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!entry) return
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setLoading(true)
    try {
      await adminApi.post(`/admin/kyc/${entry.id}/reject`, { reason: rejectionReason })
      toast.success('KYC submission rejected')
      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to reject. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      setRejectionReason('')
      onClose()
    }
  }

  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>KYC Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User info */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{entry.user.name}</p>
              <Badge variant={getTierVariant(entry.user.tier)}>{entry.user.tier}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">@{entry.user.tag}</p>
          </div>

          {/* Document details */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Document Type</span>
              <span className="font-medium">{entry.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-medium">{formatDate(entry.submittedAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Status</span>
              <StatusBadge status={entry.status} />
            </div>
          </div>

          {/* Fincra result */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fincra Result
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-2.5">
              <p className="text-xs font-mono text-foreground break-all">{entry.fincraStatus}</p>
              {entry.fincraResult && (
                <pre className="mt-1.5 text-xs font-mono text-muted-foreground overflow-auto max-h-24">
                  {JSON.stringify(entry.fincraResult, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Rejection reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Rejection Reason (required to reject)
            </label>
            <Textarea
              placeholder="Explain why this submission is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-20 text-sm"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white border-transparent"
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

  const [selectedEntry, setSelectedEntry] = useState<KycEntry | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const entries: KycEntry[] = kycData?.items ?? kycData?.data ?? kycData ?? []

  // Sort oldest first
  const sorted = [...entries].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  )

  const pendingCount = entries.filter((e) => e.status === 'PENDING').length
  const approvedToday = entries.filter((e) => {
    if (e.status !== 'APPROVED') return false
    const d = new Date(e.submittedAt)
    const today = new Date()
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    )
  }).length
  const rejectedToday = entries.filter((e) => {
    if (e.status !== 'REJECTED') return false
    const d = new Date(e.submittedAt)
    const today = new Date()
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    )
  }).length

  function openReview(entry: KycEntry) {
    setSelectedEntry(entry)
    setModalOpen(true)
  }

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['kyc'] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KYC Review Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and act on pending identity verifications
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500 shrink-0" />
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{pendingCount}</p>
              )}
              <p className="text-xs text-muted-foreground">Pending Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{approvedToday}</p>
              )}
              <p className="text-xs text-muted-foreground">Approved Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500 shrink-0" />
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-bold">{rejectedToday}</p>
              )}
              <p className="text-xs text-muted-foreground">Rejected Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No KYC submissions found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Fincra Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{entry.user.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">
                            @{entry.user.tag}
                          </span>
                          <Badge variant={getTierVariant(entry.user.tier)} className="text-xs">
                            {entry.user.tier}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">{entry.type}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs">{formatDate(entry.submittedAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeDate(entry.submittedAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground max-w-[160px] truncate block">
                        {entry.fincraStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReview(entry)}
                      >
                        Review
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

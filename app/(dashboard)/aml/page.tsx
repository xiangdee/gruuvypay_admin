'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useAdmin } from '@/hooks/useAdmin'
import {
  ShieldAlert, Clock, CheckCircle2, FileText,
  Download, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  useAmlFlags, useReviewAmlFlag, useTravelRules,
  type AmlFlag, type TravelRule,
} from '@/hooks/useFinance'
import adminApi from '@/lib/api'
import { formatDate, formatRelativeDate, cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

const RULE_LABELS: Record<string, string> = {
  HIGH_VALUE:  'High Value',
  STRUCTURING: 'Structuring',
  VELOCITY:    'Velocity',
  RAPID_LARGE: 'New Acct + Large',
  ROUND_LARGE: 'Round Amount',
}

const RULE_COLORS: Record<string, string> = {
  HIGH_VALUE:  'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  STRUCTURING: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  VELOCITY:    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  RAPID_LARGE: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  ROUND_LARGE: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
}

function RuleChip({ rule }: { rule: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border',
      RULE_COLORS[rule] ?? 'bg-muted text-muted-foreground border-border',
    )}>
      {RULE_LABELS[rule] ?? rule}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'CLEARED') return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">Cleared</Badge>
  if (status === 'FILED')   return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">Filed to NFIU</Badge>
  return <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300 dark:text-yellow-400">Pending</Badge>
}

// ── Review modal ──────────────────────────────────────────────────────────────

interface ReviewModalProps {
  flag:      AmlFlag | null
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
}

function ReviewModal({ flag, open, onClose, onSuccess }: ReviewModalProps) {
  const admin     = useAdmin()
  const reviewMut = useReviewAmlFlag()

  const [action,     setAction]     = useState<'CLEARED' | 'FILED'>('CLEARED')
  const [reviewNote, setReviewNote] = useState('')
  const [nfiuRef,    setNfiuRef]    = useState('')

  async function downloadXml() {
    if (!flag) return
    try {
      const { data } = await adminApi.get(`/admin/aml/flags/${flag.id}/xml`, {
        responseType: 'text',
      })
      const blob = new Blob([data], { type: 'application/xml' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `goAML-${flag.id}.xml`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download XML')
    }
  }

  async function submit() {
    if (!flag || !reviewNote.trim()) {
      toast.error('Review note is required')
      return
    }
    try {
      await reviewMut.mutateAsync({
        flagId:     flag.id,
        status:     action,
        reviewedBy: admin?.name ?? 'Admin',
        reviewNote: reviewNote.trim(),
        nfiuRef:    action === 'FILED' ? nfiuRef.trim() || undefined : undefined,
      })
      toast.success(action === 'FILED' ? 'Flag marked as filed to NFIU' : 'Flag cleared')
      setReviewNote('')
      setNfiuRef('')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message ?? 'Review failed')
    }
  }

  function handleClose() {
    if (!reviewMut.isPending) {
      setReviewNote('')
      setNfiuRef('')
      onClose()
    }
  }

  if (!flag) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review AML Flag</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Flag summary */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-semibold">{flag.user.firstName} {flag.user.lastName}</p>
              <RuleChip rule={flag.ruleCode} />
            </div>
            <p className="text-xs text-muted-foreground">{flag.user.email} &middot; {flag.user.tier}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{flag.reason}</p>
            <div className="flex gap-4 text-xs">
              <span><span className="text-muted-foreground">Amount: </span><span className="font-semibold">₦{flag.amountNgn}</span></span>
              <span><span className="text-muted-foreground">Type: </span><span className="font-mono">{flag.txType}</span></span>
            </div>
            {flag.txRef && (
              <p className="text-xs font-mono text-muted-foreground truncate">Ref: {flag.txRef}</p>
            )}
          </div>

          {/* Download goAML XML */}
          <Button variant="outline" size="sm" onClick={downloadXml} className="w-full gap-2">
            <Download className="h-3.5 w-3.5" />
            Download goAML XML (NFIU format)
          </Button>

          {/* Action selector */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Decision</p>
            <div className="flex gap-2">
              {(['CLEARED', 'FILED'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAction(a)}
                  disabled={reviewMut.isPending}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                    action === a
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                >
                  {a === 'CLEARED' ? 'Clear (no suspicious activity)' : 'File STR to NFIU'}
                </button>
              ))}
            </div>
          </div>

          {/* NFIU reference — only when filing */}
          {action === 'FILED' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                NFIU goAML Reference (if available)
              </label>
              <Input
                placeholder="e.g. STR-2026-00123"
                value={nfiuRef}
                onChange={(e) => setNfiuRef(e.target.value)}
                disabled={reviewMut.isPending}
                className="text-sm font-mono"
              />
            </div>
          )}

          {/* Review note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Review Note (required)
            </label>
            <Textarea
              placeholder={action === 'CLEARED'
                ? 'Explain why this flag does not indicate suspicious activity...'
                : 'Explain why an STR is being filed (include transaction details)...'}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="min-h-20 text-sm"
              disabled={reviewMut.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={reviewMut.isPending}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={reviewMut.isPending || !reviewNote.trim()}
            className={cn(
              action === 'FILED'
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent'
                : 'bg-green-600 hover:bg-green-700 text-white border-transparent',
            )}
          >
            {reviewMut.isPending ? 'Saving...' : action === 'FILED' ? 'File STR' : 'Clear Flag'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Flags table ───────────────────────────────────────────────────────────────

function FlagsTable() {
  const queryClient = useQueryClient()
  const [page,        setPage]        = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected,    setSelected]    = useState<AmlFlag | null>(null)
  const [modalOpen,   setModalOpen]   = useState(false)

  const { data, isLoading } = useAmlFlags({
    page,
    limit: 20,
    status: statusFilter || undefined,
  })

  const flags = data?.flags ?? []
  const pages = data?.pages ?? 1

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['aml'] })
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['', 'PENDING', 'CLEARED', 'FILED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === s
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {s === '' ? 'All' : s === 'PENDING' ? 'Pending' : s === 'CLEARED' ? 'Cleared' : 'Filed'}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : flags.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No AML flags found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flagged</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{flag.user.firstName} {flag.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{flag.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><RuleChip rule={flag.ruleCode} /></TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">₦{parseInt(flag.amountNgn).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">{flag.txType}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={flag.status} /></TableCell>
                    <TableCell>
                      <p className="text-xs">{formatDate(flag.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeDate(flag.createdAt)}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={flag.status === 'PENDING' ? 'default' : 'outline'}
                        onClick={() => { setSelected(flag); setModalOpen(true) }}
                      >
                        {flag.status === 'PENDING' ? 'Review' : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Page {page} of {pages} &middot; {data?.total} flags
              </p>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={page >= pages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewModal
        flag={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

// ── Travel Rule table ─────────────────────────────────────────────────────────

function TravelRulesTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useTravelRules({ page, limit: 20 })

  const records = data?.records ?? []
  const pages   = data?.pages ?? 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">FATF Travel Rule Records</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No Travel Rule records — crypto withdrawals above $1,000 USD will appear here
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Originator</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Crypto</TableHead>
                <TableHead>NGN Value</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: TravelRule) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{r.originatorName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{r.userId.slice(0, 8)}…</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{r.beneficiaryName}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={r.beneficiaryWallet}>
                      {r.beneficiaryWallet.slice(0, 10)}…
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold">{r.cryptoAmount} {r.cryptoSymbol}</span>
                    {r.networkName && <p className="text-xs text-muted-foreground">{r.networkName}</p>}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold">₦{parseInt(r.amountNgn).toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{formatDate(r.createdAt)}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">Page {page} of {pages}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={page >= pages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AmlPage() {
  const { data: pendingData }  = useAmlFlags({ status: 'PENDING',  limit: 1 })
  const { data: clearedData }  = useAmlFlags({ status: 'CLEARED',  limit: 1 })
  const { data: filedData }    = useAmlFlags({ status: 'FILED',    limit: 1 })
  const { data: travelData }   = useTravelRules({ limit: 1 })

  const pendingCount = pendingData?.total  ?? 0
  const clearedCount = clearedData?.total  ?? 0
  const filedCount   = filedData?.total    ?? 0
  const travelCount  = travelData?.total   ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AML Compliance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review flagged transactions and FATF Travel Rule records
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{clearedCount}</p>
              <p className="text-xs text-muted-foreground">Cleared</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{filedCount}</p>
              <p className="text-xs text-muted-foreground">Filed to NFIU</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-purple-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{travelCount}</p>
              <p className="text-xs text-muted-foreground">Travel Rule Records</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="flags">
        <TabsList>
          <TabsTrigger value="flags">
            AML Flags
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="travel">Travel Rule</TabsTrigger>
        </TabsList>

        <TabsContent value="flags" className="mt-4">
          <FlagsTable />
        </TabsContent>

        <TabsContent value="travel" className="mt-4">
          <TravelRulesTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

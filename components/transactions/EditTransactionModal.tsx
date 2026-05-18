'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateTransaction } from '@/hooks/useTransactions'
import type { Transaction } from './TransactionTable'

interface EditTransactionModalProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
  onSave?: (updated: Transaction) => void
}

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED']

export default function EditTransactionModal({
  transaction,
  open,
  onClose,
  onSave,
}: EditTransactionModalProps) {
  const [status, setStatus] = useState('')
  const [narration, setNarration] = useState('')
  const [metadataStr, setMetadataStr] = useState('')
  const [metadataError, setMetadataError] = useState('')

  const updateMutation = useUpdateTransaction()

  useEffect(() => {
    if (transaction) {
      setStatus(transaction.status ?? '')
      setNarration(transaction.narration ?? '')
      setMetadataStr(
        transaction.metadata ? JSON.stringify(transaction.metadata, null, 2) : ''
      )
      setMetadataError('')
    }
  }, [transaction])

  const handleMetadataChange = (val: string) => {
    setMetadataStr(val)
    if (val.trim() === '') {
      setMetadataError('')
      return
    }
    try {
      JSON.parse(val)
      setMetadataError('')
    } catch {
      setMetadataError('Invalid JSON')
    }
  }

  const handleSave = async () => {
    if (!transaction) return
    if (metadataError) {
      toast.error('Fix JSON errors before saving')
      return
    }

    let parsedMetadata: Record<string, unknown> | undefined
    if (metadataStr.trim()) {
      try {
        parsedMetadata = JSON.parse(metadataStr)
      } catch {
        toast.error('Invalid metadata JSON')
        return
      }
    }

    const payload: { status?: string; narration?: string; metadata?: Record<string, unknown> } = {}
    if (status !== transaction.status) payload.status = status
    if (narration !== transaction.narration) payload.narration = narration
    if (parsedMetadata !== undefined) payload.metadata = parsedMetadata

    try {
      await updateMutation.mutateAsync({ id: transaction.id, payload })
      toast.success('Transaction updated')
      onSave?.({ ...transaction, ...payload })
      onClose()
    } catch {
      toast.error('Failed to update transaction')
    }
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-status">Status</Label>
            <Select value={status} onValueChange={(v) => { if (v != null) setStatus(v) }}>
              <SelectTrigger id="tx-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Narration */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-narration">Narration</Label>
            <Textarea
              id="tx-narration"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Transaction narration"
              className="min-h-[80px]"
            />
          </div>

          {/* Metadata */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-metadata">
              Metadata{' '}
              <span className="text-xs text-muted-foreground font-normal">(JSON)</span>
            </Label>
            <Textarea
              id="tx-metadata"
              value={metadataStr}
              onChange={(e) => handleMetadataChange(e.target.value)}
              placeholder='{"key": "value"}'
              className={`min-h-[100px] font-mono text-xs ${metadataError ? 'border-destructive' : ''}`}
            />
            {metadataError && (
              <p className="text-xs text-destructive">{metadataError}</p>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/40 dark:bg-yellow-900/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Are you sure? This action is logged and audited.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || !!metadataError}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

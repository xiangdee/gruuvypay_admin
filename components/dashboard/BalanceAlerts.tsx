'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

// VTpass = FLW balance: { available, availableFormatted, threshold, isLow, ... }
interface VtpassData {
  available?: number | null
  availableFormatted?: string
  threshold?: number
  isLow?: boolean | null
  error?: string
}

// Quidax balance: { balance, balanceFormatted, threshold, isLow, ... }
interface QuidaxData {
  balance?: number | null
  balanceFormatted?: string
  threshold?: number
  isLow?: boolean | null
  error?: string
}

interface BalanceAlertsProps {
  vtpassData?: VtpassData
  quidaxData?: QuidaxData
}

export default function BalanceAlerts({ vtpassData, quidaxData }: BalanceAlertsProps) {
  const vtpassLow = vtpassData?.isLow === true
  const quidaxLow = quidaxData?.isLow === true

  if (!vtpassLow && !quidaxLow) return null

  return (
    <div className="space-y-2">
      {vtpassLow && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-900/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Flutterwave / VTPass Balance Low
            </p>
            <p className="text-sm text-red-600 dark:text-red-500">
              Current balance is{' '}
              <span className="font-medium">{vtpassData?.availableFormatted ?? '—'}</span>
              {vtpassData?.threshold ? ` — below the ₦${vtpassData.threshold.toLocaleString()} threshold` : ''}.
              Top up to avoid service disruptions.
            </p>
          </div>
        </div>
      )}

      {quidaxLow && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-900/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Quidax Balance Low
            </p>
            <p className="text-sm text-red-600 dark:text-red-500">
              Current balance is{' '}
              <span className="font-medium">{quidaxData?.balanceFormatted ?? '—'}</span>
              {quidaxData?.threshold ? ` — below the ₦${quidaxData.threshold.toLocaleString()} threshold` : ''}.
              Top up to avoid crypto transaction failures.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

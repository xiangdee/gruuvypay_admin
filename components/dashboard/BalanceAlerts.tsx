'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface BalanceAlertsProps {
  vtpassBalance: number
  quidaxBalance: number
  vtpassThreshold?: number
  quidaxThreshold?: number
}

export default function BalanceAlerts({
  vtpassBalance,
  quidaxBalance,
  vtpassThreshold = 50000,
  quidaxThreshold = 150000,
}: BalanceAlertsProps) {
  const vtpassLow = vtpassBalance < vtpassThreshold
  const quidaxLow = quidaxBalance < quidaxThreshold

  if (!vtpassLow && !quidaxLow) return null

  return (
    <div className="space-y-2">
      {vtpassLow && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-900/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              VTPass Balance Low
            </p>
            <p className="text-sm text-red-600 dark:text-red-500">
              Current balance is{' '}
              <span className="font-medium">{formatCurrency(vtpassBalance)}</span> — below the{' '}
              <span className="font-medium">{formatCurrency(vtpassThreshold)}</span> threshold. Top
              up to avoid service disruptions.
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
              <span className="font-medium">{formatCurrency(quidaxBalance)}</span> — below the{' '}
              <span className="font-medium">{formatCurrency(quidaxThreshold)}</span> threshold. Top
              up to avoid crypto transaction failures.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

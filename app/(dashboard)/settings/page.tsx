'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { ShieldOff, Save, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSettings, useUpdateSettings } from '@/hooks/useFinance'

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <ShieldOff className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p className="text-muted-foreground text-sm">
        Only Super Admins can access settings.
      </p>
    </div>
  )
}

interface TierLimit {
  tier: string
  dailyLimit: number
  monthlyLimit: number
}

const DEFAULT_TIERS: TierLimit[] = [
  { tier: 'TIER_0', dailyLimit: 0, monthlyLimit: 0 },
  { tier: 'TIER_1', dailyLimit: 50000, monthlyLimit: 300000 },
  { tier: 'TIER_2', dailyLimit: 200000, monthlyLimit: 1000000 },
  { tier: 'TIER_3', dailyLimit: 1000000, monthlyLimit: 5000000 },
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const role = session?.user?.role

  const { data: settingsData, isLoading } = useSettings()
  const { mutateAsync: updateSettings } = useUpdateSettings()

  // --- Balance Alert Thresholds ---
  const [vtpassMin, setVtpassMin] = useState('')
  const [quidaxMin, setQuidaxMin] = useState('')
  const [alertEmails, setAlertEmails] = useState('')
  const [savingThresholds, setSavingThresholds] = useState(false)

  // --- Transaction Limits ---
  const [tierLimits, setTierLimits] = useState<TierLimit[]>(DEFAULT_TIERS)
  const [savingLimits, setSavingLimits] = useState(false)

  // --- Maintenance Mode ---
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [savingMaintenance, setSavingMaintenance] = useState(false)

  // --- App Config ---
  const [iosUrl, setIosUrl] = useState('')
  const [androidUrl, setAndroidUrl] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [helpUrl, setHelpUrl] = useState('')
  const [savingAppConfig, setSavingAppConfig] = useState(false)

  // Populate from API
  useEffect(() => {
    if (!settingsData) return
    const s = settingsData?.data ?? settingsData

    setVtpassMin(String(s?.vtpassMinBalance ?? s?.balanceThresholds?.vtpass ?? ''))
    setQuidaxMin(String(s?.quidaxMinBalance ?? s?.balanceThresholds?.quidax ?? ''))
    setAlertEmails((s?.alertEmails ?? s?.balanceThresholds?.alertEmails ?? []).join('\n'))

    if (s?.tierLimits) {
      setTierLimits(
        DEFAULT_TIERS.map((dt) => {
          const found = s.tierLimits.find((t: TierLimit) => t.tier === dt.tier)
          return found ?? dt
        })
      )
    }

    setMaintenanceEnabled(s?.maintenanceMode?.enabled ?? false)
    setMaintenanceMessage(s?.maintenanceMode?.message ?? '')

    setIosUrl(s?.appConfig?.iosUrl ?? '')
    setAndroidUrl(s?.appConfig?.androidUrl ?? '')
    setSupportEmail(s?.appConfig?.supportEmail ?? '')
    setHelpUrl(s?.appConfig?.helpUrl ?? '')
  }, [settingsData])

  if (role !== 'SUPER_ADMIN') {
    return <AccessDenied />
  }

  async function saveThresholds() {
    setSavingThresholds(true)
    try {
      await updateSettings({
        balanceThresholds: {
          vtpass: Number(vtpassMin),
          quidax: Number(quidaxMin),
          alertEmails: alertEmails
            .split('\n')
            .map((e) => e.trim())
            .filter(Boolean),
        },
      })
      toast.success('Balance thresholds saved')
    } catch {
      toast.error('Failed to save thresholds')
    } finally {
      setSavingThresholds(false)
    }
  }

  async function saveLimits() {
    setSavingLimits(true)
    try {
      await updateSettings({ tierLimits })
      toast.success('Transaction limits saved')
    } catch {
      toast.error('Failed to save limits')
    } finally {
      setSavingLimits(false)
    }
  }

  async function saveMaintenance() {
    setSavingMaintenance(true)
    try {
      await updateSettings({
        maintenanceMode: {
          enabled: maintenanceEnabled,
          message: maintenanceMessage,
        },
      })
      toast.success('Maintenance settings saved')
    } catch {
      toast.error('Failed to save maintenance settings')
    } finally {
      setSavingMaintenance(false)
    }
  }

  async function saveAppConfig() {
    setSavingAppConfig(true)
    try {
      await updateSettings({
        appConfig: { iosUrl, androidUrl, supportEmail, helpUrl },
      })
      toast.success('App config saved')
    } catch {
      toast.error('Failed to save app config')
    } finally {
      setSavingAppConfig(false)
    }
  }

  function updateTierLimit(tier: string, field: 'dailyLimit' | 'monthlyLimit', value: string) {
    setTierLimits((prev) =>
      prev.map((t) => (t.tier === tier ? { ...t, [field]: Number(value) } : t))
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform configuration and system parameters
        </p>
      </div>

      {/* 1. Balance Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balance Alert Thresholds</CardTitle>
          <CardDescription>
            Set minimum float balances that trigger alert notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  VTpass Minimum Balance (₦)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={vtpassMin}
                  onChange={(e) => setVtpassMin(e.target.value)}
                  placeholder="e.g. 10000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Quidax Minimum Balance (₦)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={quidaxMin}
                  onChange={(e) => setQuidaxMin(e.target.value)}
                  placeholder="e.g. 10000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Alert Email Recipients
                </label>
                <Textarea
                  placeholder="One email per line"
                  value={alertEmails}
                  onChange={(e) => setAlertEmails(e.target.value)}
                  className="min-h-24 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">One email address per line</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveThresholds} disabled={savingThresholds}>
                  <Save className="h-4 w-4" />
                  Save Thresholds
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 2. Transaction Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction Limits Override</CardTitle>
          <CardDescription>
            Configure per-tier daily and monthly transaction limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
              Changes take effect immediately
            </p>
          </div>

          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Daily Limit (₦)</TableHead>
                    <TableHead>Monthly Limit (₦)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tierLimits.map((t) => (
                    <TableRow key={t.tier}>
                      <TableCell>
                        <span className="text-sm font-mono font-medium">{t.tier}</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={t.dailyLimit}
                          onChange={(e) =>
                            updateTierLimit(t.tier, 'dailyLimit', e.target.value)
                          }
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={t.monthlyLimit}
                          onChange={(e) =>
                            updateTierLimit(t.tier, 'monthlyLimit', e.target.value)
                          }
                          className="w-36"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button onClick={saveLimits} disabled={savingLimits}>
                  <Save className="h-4 w-4" />
                  Save Limits
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 3. Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maintenance Mode</CardTitle>
          <CardDescription>
            Put the app into maintenance mode with a user-facing message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {maintenanceEnabled ? 'App is currently in maintenance mode' : 'App is live'}
                  </p>
                </div>
                {/* Custom toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={maintenanceEnabled}
                  onClick={() => setMaintenanceEnabled((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    maintenanceEnabled ? 'bg-destructive' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      maintenanceEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  User-facing Message
                </label>
                <Textarea
                  placeholder="We're performing scheduled maintenance. We'll be back shortly."
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  className="min-h-24 text-sm"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={saveMaintenance}
                  disabled={savingMaintenance}
                  variant={maintenanceEnabled ? 'destructive' : 'default'}
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 4. App Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">App Configuration</CardTitle>
          <CardDescription>App store links and support contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  iOS App Store URL
                </label>
                <Input
                  type="url"
                  placeholder="https://apps.apple.com/..."
                  value={iosUrl}
                  onChange={(e) => setIosUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Android Play Store URL
                </label>
                <Input
                  type="url"
                  placeholder="https://play.google.com/..."
                  value={androidUrl}
                  onChange={(e) => setAndroidUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Support Email
                </label>
                <Input
                  type="email"
                  placeholder="support@gruuvypay.com"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Help Center URL
                </label>
                <Input
                  type="url"
                  placeholder="https://help.gruuvypay.com"
                  value={helpUrl}
                  onChange={(e) => setHelpUrl(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveAppConfig} disabled={savingAppConfig}>
                  <Save className="h-4 w-4" />
                  Save App Config
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

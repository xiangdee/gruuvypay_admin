'use client'

import { useState, useEffect } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { toast } from 'sonner'
import { ShieldOff, Save, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSettings, useUpdateSettings, useCashbackSettings, useUpdateCashbackSettings, type BillType } from '@/hooks/useFinance'

const BILL_TYPES: { key: BillType; label: string }[] = [
  { key: 'airtime',     label: 'Airtime'     },
  { key: 'data',        label: 'Data'        },
  { key: 'electricity', label: 'Electricity' },
  { key: 'cable_tv',    label: 'Cable TV'    },
  { key: 'betting',     label: 'Betting'     },
  { key: 'internet',    label: 'Internet'    },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

// API returns a flat key-value object of strings
interface SettingsData {
  flw_alert_threshold?: string
  quidax_alert_threshold?: string
  alert_emails?: string
  app_store_url?: string
  play_store_url?: string
  support_email?: string
  maintenance_mode?: string
  maintenance_message?: string
  help_url?: string
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <ShieldOff className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p className="text-muted-foreground text-sm">Only Super Admins can access settings.</p>
    </div>
  )
}

export default function SettingsPage() {
  const admin = useAdmin()
  const role = admin?.role

  const { data: settingsData, isLoading } = useSettings()
  const { mutateAsync: updateSettings } = useUpdateSettings()
  const { data: cashbackData, isLoading: cashbackLoading } = useCashbackSettings()
  const { mutateAsync: updateCashback } = useUpdateCashbackSettings()

  const [globalEnabled,    setGlobalEnabled]    = useState(true)
  const [globalPercent,    setGlobalPercent]     = useState('50')
  const [typeOverrides,    setTypeOverrides]     = useState<Record<BillType, { enabled: boolean; percent: string }>>({
    airtime: { enabled: true, percent: '' }, data: { enabled: true, percent: '' },
    electricity: { enabled: true, percent: '' }, cable_tv: { enabled: true, percent: '' },
    betting: { enabled: true, percent: '' }, internet: { enabled: true, percent: '' },
  })
  const [savingCashback, setSavingCashback] = useState(false)

  // Balance Alert Thresholds
  const [flwMin, setFlwMin] = useState('')
  const [quidaxMin, setQuidaxMin] = useState('')
  const [alertEmails, setAlertEmails] = useState('')
  const [savingThresholds, setSavingThresholds] = useState(false)

  // Maintenance Mode
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [savingMaintenance, setSavingMaintenance] = useState(false)

  // App Config
  const [iosUrl, setIosUrl] = useState('')
  const [androidUrl, setAndroidUrl] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [helpUrl, setHelpUrl] = useState('')
  const [savingAppConfig, setSavingAppConfig] = useState(false)

  useEffect(() => {
    if (!cashbackData) return
    setGlobalEnabled(cashbackData.enabled)
    setGlobalPercent(((cashbackData.percent ?? 0.5) * 100).toFixed(0))
    const overrides: typeof typeOverrides = { ...typeOverrides }
    for (const { key } of BILL_TYPES) {
      const t = cashbackData.perType?.[key]
      if (t) {
        overrides[key] = {
          enabled: t.enabled,
          percent: t.percent !== null ? ((t.percent) * 100).toFixed(0) : '',
        }
      }
    }
    setTypeOverrides(overrides)
  }, [cashbackData])

  useEffect(() => {
    if (!settingsData) return
    const s = settingsData as SettingsData

    setFlwMin(s.flw_alert_threshold ?? '')
    setQuidaxMin(s.quidax_alert_threshold ?? '')
    setAlertEmails(
      (s.alert_emails ?? '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
        .join('\n')
    )
    setMaintenanceEnabled(s.maintenance_mode === 'true')
    setMaintenanceMessage(s.maintenance_message ?? '')
    setIosUrl(s.app_store_url ?? '')
    setAndroidUrl(s.play_store_url ?? '')
    setSupportEmail(s.support_email ?? '')
    setHelpUrl(s.help_url ?? '')
  }, [settingsData])

  if (role !== 'SUPER_ADMIN') {
    return <AccessDenied />
  }

  async function saveCashback() {
    setSavingCashback(true)
    try {
      const perType: any = {}
      for (const { key } of BILL_TYPES) {
        const o = typeOverrides[key]
        perType[key] = {
          enabled: o.enabled,
          percent: o.percent !== '' ? parseFloat(o.percent) / 100 : null,
        }
      }
      await updateCashback({
        enabled: globalEnabled,
        percent: parseFloat(globalPercent) / 100,
        perType,
      })
      toast.success('Cashback settings saved')
    } catch { toast.error('Failed to save cashback settings') }
    finally { setSavingCashback(false) }
  }

  async function saveThresholds() {
    setSavingThresholds(true)
    try {
      await updateSettings({
        flw_alert_threshold: flwMin,
        quidax_alert_threshold: quidaxMin,
        alert_emails: alertEmails
          .split('\n')
          .map((e) => e.trim())
          .filter(Boolean)
          .join(','),
      })
      toast.success('Balance thresholds saved')
    } catch {
      toast.error('Failed to save thresholds')
    } finally {
      setSavingThresholds(false)
    }
  }

  async function saveMaintenance() {
    setSavingMaintenance(true)
    try {
      await updateSettings({
        maintenance_mode: maintenanceEnabled ? 'true' : 'false',
        maintenance_message: maintenanceMessage,
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
        app_store_url: iosUrl,
        play_store_url: androidUrl,
        support_email: supportEmail,
        help_url: helpUrl,
      })
      toast.success('App config saved')
    } catch {
      toast.error('Failed to save app config')
    } finally {
      setSavingAppConfig(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform configuration and system parameters</p>
      </div>

      {/* Bill Cashback Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bill Payment Cashback</CardTitle>
          <CardDescription>
            Cashback is a % of the estimated FLW commission returned to users.
            Set per-type overrides to override the global rate, or leave blank to inherit it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {cashbackLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <>
              {/* Global toggle + rate */}
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Cashback Enabled</p>
                  <p className="text-xs text-muted-foreground">Applies to all bill types unless overridden below</p>
                </div>
                <Toggle checked={globalEnabled} onChange={setGlobalEnabled} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Global Rate (% of commission)
                </label>
                <div className="relative max-w-[160px]">
                  <Input
                    type="number" min="0" max="100" step="1"
                    value={globalPercent}
                    onChange={(e) => setGlobalPercent(e.target.value)}
                    className="pr-6"
                    placeholder="50"
                    disabled={!globalEnabled}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">e.g. 50 = return 50% of the estimated FLW commission to user</p>
              </div>

              {/* Per-type overrides */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Per Bill Type</p>
                <div className="rounded-lg border border-border divide-y divide-border">
                  {BILL_TYPES.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3 px-4 py-3">
                      <Toggle
                        checked={typeOverrides[key].enabled}
                        onChange={(v) => setTypeOverrides((prev) => ({ ...prev, [key]: { ...prev[key], enabled: v } }))}
                      />
                      <span className="text-sm font-medium w-24">{label}</span>
                      <div className="relative flex-1 max-w-[120px]">
                        <Input
                          type="number" min="0" max="100" step="1"
                          value={typeOverrides[key].percent}
                          onChange={(e) => setTypeOverrides((prev) => ({ ...prev, [key]: { ...prev[key], percent: e.target.value } }))}
                          placeholder={`${globalPercent} (global)`}
                          className="pr-6 text-sm"
                          disabled={!typeOverrides[key].enabled}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                      {typeOverrides[key].percent !== '' && (
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                          onClick={() => setTypeOverrides((prev) => ({ ...prev, [key]: { ...prev[key], percent: '' } }))}
                        >
                          clear
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveCashback} disabled={savingCashback}>
                  <Save className="h-4 w-4" />
                  {savingCashback ? 'Saving...' : 'Save Cashback Settings'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Balance Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balance Alert Thresholds</CardTitle>
          <CardDescription>Set minimum float balances that trigger alert notifications</CardDescription>
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
                  Flutterwave / VTpass Minimum Balance (₦)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={flwMin}
                  onChange={(e) => setFlwMin(e.target.value)}
                  placeholder="e.g. 100000"
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
                  placeholder="e.g. 200000"
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

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maintenance Mode</CardTitle>
          <CardDescription>Put the app into maintenance mode with a user-facing message</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                  Changes take effect immediately for all users
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {maintenanceEnabled ? 'App is currently in maintenance mode' : 'App is live'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={maintenanceEnabled}
                  onClick={() => setMaintenanceEnabled((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${maintenanceEnabled ? 'bg-destructive' : 'bg-muted'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${maintenanceEnabled ? 'translate-x-5' : 'translate-x-0'}`}
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

      {/* App Config */}
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

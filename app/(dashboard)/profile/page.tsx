'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, LogOut, Trash2, Monitor, Smartphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import adminApi from '@/lib/api'
import { formatRelativeDate } from '@/lib/utils'

type AdminRole = 'SUPER_ADMIN' | 'FINANCE' | 'SUPPORT'

function RoleBadge({ role }: { role: AdminRole }) {
  const map: Record<AdminRole, string> = {
    SUPER_ADMIN:
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
    FINANCE:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
    SUPPORT:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        map[role] ?? ''
      }`}
    >
      {role.replace('_', ' ')}
    </span>
  )
}

interface PasswordCheck {
  label: string
  test: (pw: string) => boolean
}

const PASSWORD_CHECKS: PasswordCheck[] = [
  { label: 'Min 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'At least one uppercase', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least one number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'At least one special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

interface Session {
  id: string
  device: string
  ip: string
  lastSeen: string
  current?: boolean
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const user = session?.user

  // --- Change Password ---
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // --- Sessions ---
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useQuery<Session[]>({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const { data } = await adminApi.get('/admin/auth/sessions')
      return data?.sessions ?? data ?? []
    },
  })

  const sessions: Session[] = sessionsData ?? []

  const { mutateAsync: revokeSession } = useMutation({
    mutationFn: async (sessionId: string) => {
      await adminApi.delete(`/admin/auth/sessions/${sessionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] })
    },
  })

  const { mutateAsync: revokeAll } = useMutation({
    mutationFn: async () => {
      await adminApi.post('/admin/auth/sessions/revoke-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] })
    },
  })

  const passwordChecks = PASSWORD_CHECKS.map((c) => ({
    ...c,
    passed: c.test(newPassword),
  }))
  const allPasswordChecksPassed = passwordChecks.every((c) => c.passed)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!allPasswordChecksPassed) {
      toast.error('Password does not meet requirements')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setChangingPassword(true)
    try {
      await adminApi.post('/admin/auth/change-password', {
        currentPassword,
        newPassword,
      })
      toast.success('Password updated. You will be logged out of all other devices.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      refetchSessions()
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (err as any)?.response?.data?.message ?? 'Failed to update password'
      toast.error(message)
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleRevokeSession(sessionId: string) {
    try {
      await revokeSession(sessionId)
      toast.success('Session revoked')
    } catch {
      toast.error('Failed to revoke session')
    }
  }

  async function handleRevokeAll() {
    try {
      await revokeAll()
      toast.success('All other sessions have been revoked')
    } catch {
      toast.error('Failed to revoke sessions')
    }
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and security settings
        </p>
      </div>

      {/* 1. Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            {/* Avatar with initials */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
              {initials}
            </div>
            <div className="space-y-1.5">
              <p className="text-lg font-semibold">{user?.name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? '—'}</p>
              {user?.role && <RoleBadge role={user.role as AdminRole} />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>
            After changing your password, other active sessions will be logged out
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password requirements checklist */}
              {newPassword.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {passwordChecks.map((c) => (
                    <li
                      key={c.label}
                      className={`flex items-center gap-1.5 text-xs ${
                        c.passed ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="shrink-0">{c.passed ? '✓' : '○'}</span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={changingPassword || !allPasswordChecksPassed || newPassword !== confirmPassword}
              >
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Sessions</CardTitle>
          <CardDescription>Devices currently logged in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No active sessions</p>
          ) : (
            <ul className="divide-y divide-border">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {/mobile|android|iphone|ipad/i.test(s.device) ? (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {s.device}
                        {s.current && (
                          <span className="ml-2 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 text-xs">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.ip} &middot; {formatRelativeDate(s.lastSeen)}
                      </p>
                    </div>
                  </div>
                  {!s.current && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokeSession(s.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 4. Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-base text-red-600 dark:text-red-400">
            Danger Zone
          </CardTitle>
          <CardDescription>Destructive actions — use with care</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Log out all devices</p>
              <p className="text-xs text-muted-foreground">
                Immediately revoke all active sessions including this one
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="destructive" />}
              >
                <LogOut className="h-4 w-4" />
                Log Out All
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Log out all devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately revoke all active sessions including your current
                    session. You will need to log in again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleRevokeAll}
                  >
                    <Trash2 className="h-4 w-4" />
                    Log Out All Devices
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

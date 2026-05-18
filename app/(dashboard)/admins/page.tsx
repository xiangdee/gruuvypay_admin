'use client'

import { useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus, ShieldOff, Pencil, UserX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdmins } from '@/hooks/useFinance'
import adminApi from '@/lib/api'
import { formatRelativeDate } from '@/lib/utils'

type AdminRole = 'SUPER_ADMIN' | 'FINANCE' | 'SUPPORT'

// Exact shape returned by GET /admin/admins
interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

function RoleBadge({ role }: { role: AdminRole }) {
  const map: Record<AdminRole, string> = {
    SUPER_ADMIN:
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
    FINANCE:
      'bg-blue-100 text-[#C8FF57] border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
    SUPPORT:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        map[role] ?? ''
      }`}
    >
      {role.replace('_', ' ')}
    </span>
  )
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <ShieldOff className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p className="text-muted-foreground text-sm">
        Only Super Admins can manage administrators.
      </p>
    </div>
  )
}

interface AddAdminDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function AddAdminDialog({ open, onClose, onSuccess }: AddAdminDialogProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<AdminRole>('SUPPORT')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)

  function validateEmail(val: string): boolean {
    if (!val.endsWith('@gruuvypay.com')) {
      setEmailError('Email must be a @gruuvypay.com address')
      return false
    }
    setEmailError('')
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateEmail(email)) return
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setLoading(true)
    try {
      await adminApi.post('/admin/admins', { email, name, role })
      toast.success('Admin added successfully')
      setEmail('')
      setName('')
      setRole('SUPPORT')
      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to add admin. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      setEmail('')
      setName('')
      setRole('SUPPORT')
      setEmailError('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Administrator</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Name
            </label>
            <Input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email
            </label>
            <Input
              type="email"
              placeholder="admin@gruuvypay.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) validateEmail(e.target.value)
              }}
              required
              disabled={loading}
            />
            {emailError && (
              <p className="text-xs text-red-500">{emailError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Role
            </label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as AdminRole)}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="FINANCE">Finance</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              <UserPlus className="h-4 w-4" />
              Add Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditRoleDialogProps {
  admin: AdminUser | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function EditRoleDialog({ admin, open, onClose, onSuccess }: EditRoleDialogProps) {
  const [role, setRole] = useState<AdminRole>(admin?.role ?? 'SUPPORT')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!admin) return
    setLoading(true)
    try {
      await adminApi.patch(`/admin/admins/${admin.id}`, { role })
      toast.success('Role updated successfully')
      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  if (!admin) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Change role for <span className="font-medium text-foreground">{admin.name}</span>
          </p>
          <Select
            value={role}
            onValueChange={(v) => setRole(v as AdminRole)}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="FINANCE">Finance</SelectItem>
              <SelectItem value="SUPPORT">Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            Save Changes  
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminsPage() {
  const admin = useAdmin()
  const role = admin?.role

  const queryClient = useQueryClient()
  const { data: adminsData, isLoading } = useAdmins()

  const [addOpen, setAddOpen] = useState(false)
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  if (role !== 'SUPER_ADMIN') {
    return <AccessDenied />
  }

  // API returns the array directly
  const admins: AdminUser[] = Array.isArray(adminsData) ? adminsData : []

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['admins'] })
  }

  async function handleDeactivate(admin: AdminUser) {
    try {
      await adminApi.post(`/admin/admins/${admin.id}/deactivate`)
      toast.success(`${admin.name} has been deactivated`)
      handleSuccess()
    } catch {
      toast.error('Failed to deactivate admin')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage administrator accounts and permissions
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Administrators</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : admins.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No administrators found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                          {admin.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{admin.name}</span>
                        {!admin.isActive && (
                          <span className="text-xs text-red-500 italic">(inactive)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{admin.email}</span>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={admin.role} />
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {admin.lastLoginAt ? formatRelativeDate(admin.lastLoginAt) : 'Never'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditAdmin(admin)
                            setEditOpen(true)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Role
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={!admin.isActive}
                              />
                            }
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Deactivate
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate Admin</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to deactivate{' '}
                                <strong>{admin.name}</strong>? They will lose access
                                immediately.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDeactivate(admin)}
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddAdminDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={handleSuccess}
      />
      <EditRoleDialog
        admin={editAdmin}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

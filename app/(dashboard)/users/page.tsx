'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUsers, useSuspendUser } from '@/hooks/useUsers'
import { UserTable } from '@/components/users/UserTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 25

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(tier !== 'all' ? { tier } : {}),
    ...(status !== 'all' ? { status } : {}),
  }

  const { data, isLoading } = useUsers(params)
  const suspendMutation = useSuspendUser()

  const users = data?.data ?? data?.users ?? []
  const total: number = data?.total ?? data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function handleSuspend(id: string, reason: string) {
    toast.promise(
      suspendMutation.mutateAsync({ id, reason }),
      {
        loading: 'Suspending user...',
        success: 'User suspended.',
        error: (err) =>
          err?.response?.data?.message ?? 'Failed to suspend user.',
      }
    )
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleTierChange(value: string | null) {
    setTier(value ?? 'all')
    setPage(1)
  }

  function handleStatusChange(value: string | null) {
    setStatus(value ?? 'all')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? '—' : total.toLocaleString()} total
        </p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, @username, phone..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Tier filter */}
        <Select value={tier} onValueChange={handleTierChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="TIER_0">TIER_0</SelectItem>
            <SelectItem value="TIER_1">TIER_1</SelectItem>
            <SelectItem value="TIER_2">TIER_2</SelectItem>
            <SelectItem value="TIER_3">TIER_3</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>

        {/* Export CSV — placeholder */}
        <Button variant="outline" disabled className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <UserTable
        data={users}
        loading={isLoading}
        onSuspend={handleSuspend}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {isLoading
            ? 'Loading...'
            : `Showing ${Math.min((page - 1) * PAGE_SIZE + 1, total)}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()}`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">25 per page</span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

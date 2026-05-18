'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAdmin } from '@/hooks/useAdmin'
import { Sun, Moon, Bell, User, KeyRound, LogOut, ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// ── Route → title + breadcrumb ────────────────────────────────────────────────

const ROUTE_MAP: Record<string, string[]> = {
  '/dashboard':    ['Dashboard'],
  '/users':        ['Users'],
  '/kyc':          ['Users', 'KYC Queue'],
  '/transactions': ['Transactions'],
  '/bills':        ['Transactions', 'Bills'],
  '/crypto':       ['Transactions', 'Crypto'],
  '/finance':      ['Finance'],
  '/analytics':    ['Analytics'],
  '/admins':       ['Settings', 'Admin Users'],
  '/settings':     ['Settings'],
  '/profile':      ['Profile'],
}

function getBreadcrumb(pathname: string): string[] {
  if (ROUTE_MAP[pathname]) return ROUTE_MAP[pathname]
  // Match prefix (e.g. /users/abc123)
  const match = Object.keys(ROUTE_MAP)
    .filter((k) => k !== '/dashboard' && pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]
  if (match) {
    const parts = ROUTE_MAP[match]
    return [...parts, 'Detail']
  }
  const last = pathname.split('/').filter(Boolean).pop()
  return last ? [last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')] : ['GruuvyPay']
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('')
}

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  window.location.href = '/login'
}

// ── Theme toggle ──────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-lg border border-border',
        'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
      )}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

// ── Topbar ────────────────────────────────────────────────────────────────────

export function Topbar() {
  const pathname = usePathname()
  const admin = useAdmin()
  const name = admin?.name ?? ''
  const email = admin?.email ?? ''
  const initials = getInitials(name)
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Breadcrumb — hidden on mobile (sidebar button takes that space) */}
      <div className="hidden lg:flex items-center gap-1.5 min-w-0">
        {breadcrumb.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
            <span
              className={cn(
                'text-sm font-medium truncate',
                i === breadcrumb.length - 1 ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {seg}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile: page title */}
      <p className="ml-10 text-sm font-semibold text-foreground lg:hidden">
        {breadcrumb[breadcrumb.length - 1]}
      </p>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Notification bell */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#dbd861]" />
        </button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbd861] text-xs font-bold text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            aria-label="User menu"
          >
            {initials || <User className="h-4 w-4" />}
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="end" sideOffset={8} className="w-56">
            {/* User info */}
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-foreground leading-none">{name || '—'}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{email}</p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              <User className="h-4 w-4" />
              Profile & Security
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              <KeyRound className="h-4 w-4" />
              Change Password
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

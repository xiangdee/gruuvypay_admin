'use client'

import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Bell, User, KeyRound, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/kyc': 'KYC Queue',
  '/transactions': 'Transactions',
  '/bills': 'Bills',
  '/crypto': 'Crypto',
  '/finance': 'Finance',
  '/analytics': 'Analytics',
  '/admins': 'Admin Users',
  '/settings': 'Settings',
  '/profile': 'Profile',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname]

  // Match by prefix (longest match wins)
  const segments = Object.keys(PATH_TITLES)
    .filter((key) => pathname.startsWith(key + '/'))
    .sort((a, b) => b.length - a.length)

  if (segments[0]) return PATH_TITLES[segments[0]]

  // Fallback: capitalise the last path segment
  const last = pathname.split('/').filter(Boolean).pop()
  if (!last) return 'GruuvyPay Admin'
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function Topbar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const name = session?.user?.name ?? ''
  const email = session?.user?.email ?? ''
  const initials = getInitials(name)
  const title = getPageTitle(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6 shadow-sm">
      {/* Page title */}
      <h1 className="flex-1 text-base font-semibold text-gray-900 lg:text-lg">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Placeholder badge */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
        </button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none"
            aria-label="User menu"
          >
            {initials || <User className="h-4 w-4" />}
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="end" sideOffset={8}>
            {/* User info header */}
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground leading-none">
                {name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {email}
              </p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => window.location.href = '/profile/change-password'}>
              <KeyRound className="h-4 w-4" />
              Change Password
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

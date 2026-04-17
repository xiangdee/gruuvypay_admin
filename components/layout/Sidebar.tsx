'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ArrowLeftRight,
  Receipt,
  Bitcoin,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

type Role = 'SUPER_ADMIN' | 'FINANCE' | 'SUPPORT'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
  indent?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'],
  },
  {
    label: 'KYC Queue',
    href: '/kyc',
    icon: ClipboardCheck,
    roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'],
    indent: true,
  },
  {
    label: 'Transactions',
    href: '/transactions',
    icon: ArrowLeftRight,
    roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'],
  },
  {
    label: 'Bills',
    href: '/bills',
    icon: Receipt,
    roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'],
    indent: true,
  },
  {
    label: 'Crypto',
    href: '/crypto',
    icon: Bitcoin,
    roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'],
    indent: true,
  },
  {
    label: 'Finance',
    href: '/finance',
    icon: TrendingUp,
    roles: ['SUPER_ADMIN', 'FINANCE'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'],
  },
  {
    label: 'Admin Users',
    href: '/admins',
    icon: ShieldCheck,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN'],
  },
]

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  FINANCE: 'Finance',
  SUPPORT: 'Support',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const role = session?.user?.role as Role | undefined
  const name = session?.user?.name ?? ''
  const email = session?.user?.email ?? ''

  const visibleItems = NAV_ITEMS.filter(
    (item) => !role || item.roles.includes(role)
  )

  const SidebarContent = () => (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: '#0F0F0F' }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-4 border-b border-white/10">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 text-white"
            aria-hidden="true"
          >
            <path
              d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
              fill="currentColor"
              opacity="0.25"
            />
            <path
              d="M8 12h8M12 8l4 4-4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">
          GruuvyPay
        </span>
        <span className="ml-auto text-[10px] font-medium uppercase tracking-widest text-blue-500">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    item.indent && 'ml-4',
                    isActive
                      ? 'border-l-2 border-blue-500 bg-white/10 pl-[10px] text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-blue-400' : 'text-white/50 group-hover:text-white/70'
                    )}
                  />
                  <span>{item.label}</span>
                  {item.indent && (
                    <ChevronRight className="ml-auto h-3 w-3 opacity-30" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {getInitials(name)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-none text-white">
              {name}
            </p>
            <p className="truncate text-xs text-white/50 mt-0.5">{email}</p>
            {role && (
              <span className="mt-1 inline-flex items-center rounded-sm bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                {ROLE_LABELS[role]}
              </span>
            )}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign out"
            className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-md bg-[#0F0F0F] text-white shadow-md lg:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 transform transition-transform duration-200 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden w-60 shrink-0 lg:flex lg:flex-col">
        <SidebarContent />
      </aside>
    </>
  )
}

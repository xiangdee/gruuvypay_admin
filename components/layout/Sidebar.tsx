'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
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
  ShieldAlert,
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
  { label: 'Dashboard',   href: '/dashboard',    icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'] },
  { label: 'Users',       href: '/users',        icon: Users,           roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'] },
  { label: 'KYC Queue',   href: '/kyc',          icon: ClipboardCheck,  roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'], indent: true },
  { label: 'Transactions',href: '/transactions', icon: ArrowLeftRight,  roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'] },
  { label: 'Bills',       href: '/bills',        icon: Receipt,         roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'], indent: true },
  { label: 'Crypto',      href: '/crypto',       icon: Bitcoin,         roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'], indent: true },
  { label: 'Finance',     href: '/finance',      icon: TrendingUp,      roles: ['SUPER_ADMIN', 'FINANCE'] },
  { label: 'Analytics',   href: '/analytics',    icon: BarChart3,       roles: ['SUPER_ADMIN', 'FINANCE', 'SUPPORT'] },
  { label: 'AML',         href: '/aml',          icon: ShieldAlert,     roles: ['SUPER_ADMIN', 'FINANCE'] },
  { label: 'Admin Users', href: '/admins',       icon: ShieldCheck,     roles: ['SUPER_ADMIN'] },
  { label: 'Settings',    href: '/settings',     icon: Settings,        roles: ['SUPER_ADMIN'] },
]

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  FINANCE: 'Finance',
  SUPPORT: 'Support',
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('')
}

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  window.location.href = '/login'
}

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex h-14 items-center gap-3 px-4 border-b border-white/8">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dbd861]">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-black" aria-hidden>
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="currentColor" opacity="0.2"/>
          <path d="M8 12h8M12 8l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight text-white leading-none">GruuvyPay</p>
        <p className="text-[10px] font-medium tracking-widest text-[#dbd861] uppercase mt-0.5">Admin</p>
      </div>
    </div>
  )
}

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        item.indent && 'ml-5',
        isActive
          ? 'bg-[#dbd861]/12 text-[#dbd861]'
          : 'text-white/55 hover:bg-white/6 hover:text-white/90'
      )}
    >
      {/* Active bar */}
      <span
        className={cn(
          'absolute left-0 h-5 w-0.5 rounded-r-full bg-[#dbd861] transition-all',
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
        )}
      />
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive ? 'text-[#dbd861]' : 'text-white/40 group-hover:text-white/70'
        )}
      />
      <span className="truncate">{item.label}</span>
      {item.indent && (
        <ChevronRight className="ml-auto h-3 w-3 opacity-25 shrink-0" />
      )}
    </Link>
  )
}

// ── User footer ───────────────────────────────────────────────────────────────

function UserFooter() {
  const admin = useAdmin()
  const name = admin?.name ?? ''
  const email = admin?.email ?? ''
  const role = admin?.role as Role | undefined
  const initials = getInitials(name) || '?'

  return (
    <div className="border-t border-white/8 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        {/* Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dbd861] text-xs font-bold text-black">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white leading-none">{name || '—'}</p>
          <p className="truncate text-[11px] text-white/40 mt-0.5">{email}</p>
          {role && (
            <span className="mt-1 inline-flex items-center rounded-sm bg-[#dbd861]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#dbd861] uppercase tracking-wide">
              {ROLE_LABELS[role]}
            </span>
          )}
        </div>

        <button
          onClick={handleLogout}
          title="Sign out"
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/35 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Sidebar content ───────────────────────────────────────────────────────────

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()
  const admin = useAdmin()
  const role = admin?.role as Role | undefined

  const visibleItems = NAV_ITEMS.filter(
    (item) => !role || item.roles.includes(role)
  )

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--sidebar)' }}>
      <Logo />

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <div key={item.href} className="relative">
              <NavLink item={item} isActive={isActive} onClick={onNavClick} />
            </div>
          )
        })}
      </nav>

      <UserFooter />
    </div>
  )
}

// ── Sidebar (exported) ────────────────────────────────────────────────────────

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed left-4 top-3.5 z-50 flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted lg:hidden"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
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
        <SidebarContent onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:flex lg:flex-col">
        <SidebarContent />
      </aside>
    </>
  )
}

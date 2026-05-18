import { cookies } from "next/headers"

export async function getAdminToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("admin_token")?.value ?? null
}

const ROLE_DISPLAY: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  FINANCE: "Finance",
  SUPPORT: "Support",
}

export function formatRole(role: string): string {
  return ROLE_DISPLAY[role] ?? role
}

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 3,
  FINANCE: 2,
  SUPPORT: 1,
}

export function hasRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0
  return userLevel >= requiredLevel
}

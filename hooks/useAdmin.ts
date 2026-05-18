"use client"

import { useState, useEffect } from "react"

export type AdminRole = "SUPER_ADMIN" | "FINANCE" | "SUPPORT"

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
}

export function useAdmin(): AdminUser | null {
  const [admin, setAdmin] = useState<AdminUser | null>(null)

  useEffect(() => {
    const raw = document.cookie
      .split("; ")
      .find((row) => row.startsWith("admin_info="))
      ?.split("=")
      .slice(1)
      .join("=")
    if (!raw) return
    try {
      setAdmin(JSON.parse(decodeURIComponent(raw)) as AdminUser)
    } catch {
      setAdmin(null)
    }
  }, [])

  return admin
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function parseDate(date: unknown): Date | null {
  try {
    if (date == null || date === "") return null
    if (date instanceof Date) return isNaN(date.getTime()) ? null : date
    if (typeof date === "number") {
      const d = new Date(date)
      return isNaN(d.getTime()) ? null : d
    }
    const d = new Date(String(date))
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

export function formatDate(date: unknown): string {
  const d = parseDate(date)
  if (!d) return "—"
  return d.toLocaleString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function formatRelativeDate(date: unknown): string {
  const d = parseDate(date)
  if (!d) return "—"
  try {
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return "—"
  }
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-NG")
}

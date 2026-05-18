import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ApiLink } from "@/lib/constants/links"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value

  if (token) {
    await fetch(`${ApiLink}/admin/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete("admin_token")
  response.cookies.delete("admin_info")
  return response
}

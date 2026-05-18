import { NextResponse } from "next/server"
import { ApiLink } from "@/lib/constants/links"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const res = await fetch(`${ApiLink}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  const { token, admin } = data as { token: string; admin: Record<string, unknown> }

  const cookieOpts = {
    httpOnly: false,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60,
    path: "/",
  }

  const response = NextResponse.json({ admin })
  response.cookies.set("admin_token", token, cookieOpts)
  response.cookies.set("admin_info", JSON.stringify(admin), cookieOpts)

  return response
}

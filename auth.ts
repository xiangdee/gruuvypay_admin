import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: "SUPER_ADMIN" | "FINANCE" | "SUPPORT"
      token: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: "SUPER_ADMIN" | "FINANCE" | "SUPPORT"
    token: string
  }
}

const config: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string
          password: string
        }

        if (!email || !password) return null

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            }
          )

          if (!res.ok) return null

          const data = await res.json()

          if (!data?.token || !data?.user) return null

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            token: data.token,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.accessToken = user.token
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as "SUPER_ADMIN" | "FINANCE" | "SUPPORT",
        token: token.accessToken as string,
      } as typeof session.user
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)

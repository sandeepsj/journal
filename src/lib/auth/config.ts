// Edge-compatible auth config — no Node.js-only imports (no Mongoose).
// Used by middleware. The full config (with DB callbacks) is in options.ts.
import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = request.nextUrl.pathname === '/login'
      const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth')

      if (isApiAuth) return true
      if (isLoginPage) return true
      return isLoggedIn
    },
  },
}

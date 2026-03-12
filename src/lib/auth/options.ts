import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { connectDB } from '@/lib/db/client'
import { User } from '@/lib/db/models/User'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return false

      await connectDB()

      await User.findOneAndUpdate(
        { googleId: account.providerAccountId },
        {
          $set: {
            email: user.email!,
            name: user.name!,
            image: user.image ?? '',
            googleId: account.providerAccountId,
            lastLoginAt: new Date(),
          },
        },
        { upsert: true, new: true }
      )

      return true
    },

    async session({ session, token }) {
      if (token.sub) {
        // Attach MongoDB userId to session via token
        session.user.id = token.sub
      }
      return session
    },

    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        // Store googleId in token to look up userId on session callback
        await connectDB()
        const dbUser = await User.findOne({ googleId: account.providerAccountId }).lean()
        if (dbUser) {
          token.sub = String(dbUser._id)
        }
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
  },
})

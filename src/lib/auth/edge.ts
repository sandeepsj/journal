// Edge-compatible NextAuth instance — no Mongoose, safe for middleware runtime.
import NextAuth from 'next-auth'
import { authConfig } from './config'

export const { auth } = NextAuth(authConfig)

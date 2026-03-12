'use client'

import { signOut } from 'next-auth/react'
import { Navbar } from './Navbar'

export interface NavbarClientProps {
  userName: string
  userEmail?: string
  userImage?: string | null
}

export function NavbarClient({ userName, userEmail, userImage }: NavbarClientProps) {
  return (
    <Navbar
      userName={userName}
      userEmail={userEmail}
      userImage={userImage}
      onSignOut={() => signOut({ callbackUrl: '/login' })}
    />
  )
}

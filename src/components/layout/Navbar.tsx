'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

export interface NavbarProps {
  userName: string
  userEmail?: string
  userImage?: string | null
  onSignOut: () => void
}

export function Navbar({ userName, userEmail, userImage, onSignOut }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-[#E8E2D9] bg-[#FAF8F5]/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl text-[#2C2825] hover:text-[#7C9E8A] transition-colors duration-150"
        >
          Muse
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="User menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9E8A] focus-visible:ring-offset-2"
          >
            <Avatar src={userImage} name={userName} size="sm" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 bg-white border border-[#E8E2D9] rounded-xl shadow-md p-1 animate-fade-in"
            >
              <div className="px-3 py-2 border-b border-[#E8E2D9] mb-1">
                <p className="text-sm font-medium text-[#2C2825] truncate">{userName}</p>
                {userEmail && (
                  <p className="text-xs text-[#B5A99F] truncate">{userEmail}</p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => {
                  setMenuOpen(false)
                  onSignOut()
                }}
                role="menuitem"
                className="justify-start text-[#8B7D72] hover:text-[#C4614E]"
              >
                Sign out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

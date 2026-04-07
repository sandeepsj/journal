import { Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from './ThemeToggle'

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
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/80 backdrop-blur-md shadow-[var(--shadow-xs)]">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif text-2xl text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors duration-150"
        >
          Muse
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="User menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              <Avatar src={userImage} name={userName} size="sm" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-52 bg-[var(--color-surface)]/90 backdrop-blur-sm border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-lg)] p-1 animate-fade-in"
              >
                <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                  <p className="text-base font-medium text-[var(--color-text-primary)] truncate">{userName}</p>
                  {userEmail && (
                    <p className="text-sm text-[var(--color-text-muted)] truncate">{userEmail}</p>
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
                  className="justify-start text-[var(--color-text-secondary)] hover:text-[var(--color-error)]"
                >
                  Sign out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

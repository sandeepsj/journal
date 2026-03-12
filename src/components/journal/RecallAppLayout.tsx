'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatSidebar, ChatSessionPreview } from './ChatSidebar'
import { RecallChatPanel, ChatMessage } from './RecallChatPanel'
import { NavbarClient } from '@/components/layout/NavbarClient'

interface RecallAppLayoutProps {
  userName: string
  userEmail?: string
  userImage?: string | null
}

export function RecallAppLayout({ userName, userEmail, userImage }: RecallAppLayoutProps) {
  const [sessions, setSessions] = useState<ChatSessionPreview[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([])
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/recall/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (err) {
      console.error('Failed to fetch sessions', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    async function loadActiveSession() {
      if (!activeSessionId) {
        setActiveMessages([])
        return
      }
      try {
        const res = await fetch(`/api/recall/sessions/${activeSessionId}`)
        if (res.ok) {
          const data = await res.json()
          setActiveMessages(data.messages || [])
        }
      } catch (err) {
        console.error('Failed to fetch active session messages', err)
      }
    }
    loadActiveSession()
  }, [activeSessionId])

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return
    
    try {
      const res = await fetch(`/api/recall/sessions/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setSessions((prev) => prev.filter(s => s._id !== id))
        if (activeSessionId === id) {
          setActiveSessionId(null)
          setActiveMessages([])
        }
      }
    } catch (err) {
      console.error('Failed to delete session', err)
    }
  }

  const handleNewChat = () => {
    setActiveSessionId(null)
    setActiveMessages([])
    setMobileSidebarOpen(false)
  }

  const handleSessionCreated = (id: string, title: string) => {
    setActiveSessionId(id)
    setSessions((prev) => [{ _id: id, title, updatedAt: new Date().toISOString() }, ...prev])
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAF9F7]">
      {/* Hide standard navbar to give full chat view feel. If user wants a top nav, we can keep it. 
          The mockup actually shows 'Back' and 'AI Recall' in a custom header. 
          Let's provide a slim overlay button to go back to dashboard. */}
      
      <div className="absolute top-4 left-4 z-50 md:hidden">
         {/* Hamburger is in ChatPanel header for mobile */}
      </div>

      <div className="flex flex-1 h-full overflow-hidden">
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onDeleteSession={handleDeleteSession}
          onNewChat={handleNewChat}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
        
        <main className="flex-1 flex flex-col min-w-0 h-full relative">
           {/* Custom absolute button to go back to journal dashboard */}
          <div className="hidden md:flex absolute top-3 left-4 z-20 items-center">
            <a href="/dashboard" className="flex items-center gap-1 text-[#847B73] hover:text-[#2C2825] transition-colors text-sm font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Dashboard
            </a>
          </div>

          <RecallChatPanel
            sessionId={activeSessionId}
            initialMessages={activeMessages}
            onSessionCreated={handleSessionCreated}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
          />
        </main>
      </div>
    </div>
  )
}

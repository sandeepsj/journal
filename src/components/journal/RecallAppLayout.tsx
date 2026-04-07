import { useState } from 'react'
import { ChatSidebar, ChatSessionPreview } from './ChatSidebar'
import { RecallChatPanel, ChatMessage } from './RecallChatPanel'

interface RecallAppLayoutProps {
  userName: string
  userEmail?: string
  userImage?: string | null
}

export function RecallAppLayout({ userName }: RecallAppLayoutProps) {
  const [sessions, setSessions] = useState<ChatSessionPreview[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeMessages] = useState<ChatMessage[]>([])
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter(s => s._id !== id))
    if (activeSessionId === id) {
      setActiveSessionId(null)
    }
  }

  const handleSelectSession = (id: string | null) => {
    setActiveSessionId(id)
  }

  const handleNewChat = () => {
    setActiveSessionId(null)
    setMobileSidebarOpen(false)
  }

  const handleSessionCreated = (id: string, title: string) => {
    setActiveSessionId(id)
    setSessions((prev) => [{ _id: id, title, updatedAt: new Date().toISOString() }, ...prev])
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAF9F7]">
      <div className="flex flex-1 h-full overflow-hidden">
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onNewChat={handleNewChat}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full relative">
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

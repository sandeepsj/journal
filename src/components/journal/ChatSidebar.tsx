import { Button } from '@/components/ui/Button'

export interface ChatSessionPreview {
  _id: string
  title: string
  updatedAt: string
}

interface ChatSidebarProps {
  sessions: ChatSessionPreview[]
  activeSessionId: string | null
  onSelectSession: (id: string | null) => void
  onDeleteSession: (id: string) => void
  onNewChat: () => void
  isMobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  isMobileSidebarOpen,
  setMobileSidebarOpen,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 w-64 md:w-72 bg-[var(--color-surface-muted)] border-r border-[var(--color-border)] flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-4 pt-4 pb-0">
          <a href="/" className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm font-medium mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Dashboard
          </a>
        </div>
        <div className="px-4 pb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl tracking-wide text-[var(--color-text-primary)] flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-text-muted)]">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
              <path d="M12 8v4l3 3" />
            </svg>
            AI Recall
          </h2>
          <button
            title="New Chat"
            onClick={onNewChat}
            className="p-2 hover:bg-[var(--color-border)] rounded-md transition-colors text-[var(--color-text-primary)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14m-7-7h14" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] px-2 py-4 text-center">No past conversations</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session._id}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  activeSessionId === session._id
                    ? 'bg-[var(--color-border)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text-primary)]'
                }`}
                onClick={() => {
                  onSelectSession(session._id)
                  setMobileSidebarOpen(false)
                }}
              >
                <div className="truncate text-sm font-medium">{session.title}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session._id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--color-error)] transition-opacity"
                  title="Delete chat"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

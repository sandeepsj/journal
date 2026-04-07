import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getEntry } from '@/lib/drive'
import { JournalEditor } from '@/components/journal/JournalEditor'
import { LoadingDots } from '@/components/ui/LoadingDots'
import type { DriveJournalEntry } from '@/lib/drive'

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const { accessToken } = useAuth()
  const [entry, setEntry] = useState<DriveJournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(!!id)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !accessToken) return

    async function loadEntry() {
      try {
        const data = await getEntry(accessToken!, id!)
        setEntry(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entry')
      } finally {
        setIsLoading(false)
      }
    }

    loadEntry()
  }, [id, accessToken])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingDots size="md" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-error)]">{error}</p>
      </div>
    )
  }

  // New entry
  if (!id) {
    return <JournalEditor />
  }

  // Existing entry loaded
  return (
    <JournalEditor
      entryId={id}
      initialTitle={entry?.title}
      initialBody={entry?.body}
      initialMood={entry?.mood}
      initialTextColor={entry?.textColor}
      initialDrawing={entry?.drawing}
      initialPinned={entry?.pinned}
    />
  )
}

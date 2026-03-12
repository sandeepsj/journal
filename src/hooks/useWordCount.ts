import { useMemo } from 'react'

export function useWordCount(text: string): number {
  return useMemo(() => {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).length
  }, [text])
}

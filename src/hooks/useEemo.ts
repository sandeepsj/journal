'use client'

import { useState, useRef, useEffect } from 'react'
import type { Emotion } from 'react-emotion-face'

export interface EemoState {
  emotion: Emotion | null
  message: string | null
  isLoading: boolean
}

export function useEemo(title: string, body: string): EemoState {
  const [emotion, setEmotion] = useState<Emotion | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastSentContentRef = useRef<string>('')

  useEffect(() => {
    const content = `${title}\n\n${body}`.trim()

    // Clear pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    if (content.length < 20) return

    // Skip if content hasn't changed meaningfully since last API call
    const last = lastSentContentRef.current
    const lengthDiff = Math.abs(content.length - last.length)
    if (last && lengthDiff < 50 && content.endsWith(last.slice(-30))) return

    debounceRef.current = setTimeout(async () => {
      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      setIsLoading(true)

      try {
        const res = await fetch('/api/eemo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
          signal: controller.signal,
        })

        if (!res.ok) return

        const data = await res.json()

        if (data.emotion) {
          lastSentContentRef.current = content
          setEmotion(data.emotion as Emotion)
          setMessage(data.message ?? null)
        }
      } catch (err) {
        // Ignore abort errors silently
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('[useEemo] fetch error:', err)
        // Keep last known emotion on error
      } finally {
        setIsLoading(false)
      }
    }, 3000)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [title, body])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  return { emotion, message, isLoading }
}

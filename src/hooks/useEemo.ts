import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { llmProxy } from '@/lib/llm-proxy'
import type { Emotion } from 'react-emotion-face'

export interface EemoState {
  emotion: Emotion | null
  message: string | null
  isLoading: boolean
}

export function useEemo(title: string, body: string): EemoState {
  const { accessToken } = useAuth()
  const [emotion, setEmotion] = useState<Emotion | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastSentContentRef = useRef<string>('')

  useEffect(() => {
    const content = `${title}\n\n${body}`.trim()

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    if (content.length < 20 || !accessToken) return

    // Skip if content hasn't changed meaningfully since last API call
    const last = lastSentContentRef.current
    const lengthDiff = Math.abs(content.length - last.length)
    if (last && lengthDiff < 50 && content.endsWith(last.slice(-30))) return

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      setIsLoading(true)

      try {
        const res = await llmProxy(
          'anthropic',
          'messages',
          {
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages: [
              {
                role: 'user',
                content: `You are Eemo, a gentle emotional presence. Read this journal entry and respond with JSON only — no other text.

Journal entry:
"""
${content}
"""

Respond with exactly this JSON format:
{"emotion": "<one of: happy, sad, calm, anxious, grateful, angry, surprised, disgusted, fearful>", "message": "<a warm, brief 1-sentence reflection>"}`,
              },
            ],
          },
          accessToken
        )

        const data = await res.json()
        const text = data.content?.[0]?.text || '{}'

        try {
          const parsed = JSON.parse(text)
          if (parsed.emotion) {
            lastSentContentRef.current = content
            setEmotion(parsed.emotion as Emotion)
            setMessage(parsed.message ?? null)
          }
        } catch {
          // ignore malformed JSON
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('[useEemo] error:', err)
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
  }, [title, body, accessToken])

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  return { emotion, message, isLoading }
}

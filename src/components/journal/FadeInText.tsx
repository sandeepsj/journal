
import { useRef, useMemo } from 'react'

export interface FadeInTextProps {
  text: string
  className?: string
  as?: 'p' | 'span' | 'div'
}

export function FadeInText({ text, className = '', as: Tag = 'p' }: FadeInTextProps) {
  const prevWordCountRef = useRef(0)

  const words = useMemo(() => text.split(/(\s+)/), [text])

  // Count actual words (not whitespace tokens)
  const wordCount = words.filter((w) => w.trim().length > 0).length
  const prevCount = prevWordCountRef.current

  // Update ref after render
  if (wordCount !== prevCount) {
    prevWordCountRef.current = wordCount
  }

  // How many tokens correspond to "new" words
  let newWordsRemaining = Math.max(0, wordCount - prevCount)
  let actualWordsSeen = 0

  const tokens = words.map((token, i) => {
    const isWord = token.trim().length > 0

    if (isWord) {
      actualWordsSeen++
      const totalWordsBefore = wordCount - newWordsRemaining
      const isNew = actualWordsSeen > totalWordsBefore

      if (isNew) {
        newWordsRemaining--
        return (
          <span key={i} className="animate-word-fade inline">
            {token}
          </span>
        )
      }
    }

    return <span key={i} className="inline">{token}</span>
  })

  return <Tag className={className}>{tokens}</Tag>
}

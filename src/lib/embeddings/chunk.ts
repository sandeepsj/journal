const CHUNK_WORDS = 150   // target words per chunk
const OVERLAP_WORDS = 20  // words shared between adjacent chunks

/** Split text into overlapping word-based chunks */
export function chunkText(text: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= CHUNK_WORDS) return [text.trim()]

  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + CHUNK_WORDS, words.length)
    chunks.push(words.slice(start, end).join(' '))
    if (end === words.length) break
    start = end - OVERLAP_WORDS
  }

  return chunks
}

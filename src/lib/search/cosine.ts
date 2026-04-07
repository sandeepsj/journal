/** Cosine similarity between two vectors of equal length */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const magnitude = Math.sqrt(magA) * Math.sqrt(magB)
  return magnitude === 0 ? 0 : dot / magnitude
}

export interface EmbeddedEntry {
  fileId: string
  title: string
  body: string
  embedding: number[]
}

export interface SearchResult {
  fileId: string
  title: string
  body: string
  score: number
}

/**
 * Find the top-K most similar entries to a query embedding.
 * Runs entirely in memory — no network calls.
 */
export function findSimilar(
  queryEmbedding: number[],
  entries: EmbeddedEntry[],
  topK = 5
): SearchResult[] {
  const scored = entries
    .map((entry) => ({
      fileId: entry.fileId,
      title: entry.title,
      body: entry.body,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }))
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, topK)
}

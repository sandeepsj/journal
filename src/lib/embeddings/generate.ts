// Voyage AI embeddings — voyage-3 model, 1024 dims
// Docs: https://docs.voyageai.com/reference/embeddings-api

const EMBEDDING_MODEL = 'voyage-3'
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const MAX_CHARS = 8000

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error('VOYAGE_API_KEY environment variable is not defined')

  const trimmed = text.slice(0, MAX_CHARS)

  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: trimmed }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voyage AI embedding failed (${res.status}): ${err}`)
  }

  const json = await res.json()
  return json.data[0].embedding as number[]
}

export function buildEmbeddingInput(title: string, body: string): string {
  return `${title}\n\n${body}`
}

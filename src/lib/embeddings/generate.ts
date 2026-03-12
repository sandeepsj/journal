// Embedding provider switcher — set EMBEDDING_PROVIDER=openai or voyage (default: voyage)
// OpenAI: text-embedding-3-small, 1536 dims, needs OPENAI_API_KEY
// Voyage:  voyage-3,              1024 dims, needs VOYAGE_API_KEY

const MAX_CHARS = 8000

async function embedViaVoyage(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error('VOYAGE_API_KEY environment variable is not defined')

  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'voyage-3', input: text }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voyage AI embedding failed (${res.status}): ${err}`)
  }

  const json = await res.json()
  return json.data[0].embedding as number[]
}

async function embedViaOpenAI(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not defined')

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI embedding failed (${res.status}): ${err}`)
  }

  const json = await res.json()
  return json.data[0].embedding as number[]
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = (process.env.EMBEDDING_PROVIDER ?? 'voyage').toLowerCase()
  const trimmed = text.slice(0, MAX_CHARS)

  console.log(`[embedding] provider=${provider}`)

  if (provider === 'openai') return embedViaOpenAI(trimmed)
  return embedViaVoyage(trimmed)
}

export function buildEmbeddingInput(title: string, body: string): string {
  return `${title}\n\n${body}`
}

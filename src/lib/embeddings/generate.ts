import OpenAI from 'openai'

const EMBEDDING_MODEL = 'text-embedding-3-small'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}
const MAX_CHARS = 8000 // ~2000 tokens, well within model limit

export async function generateEmbedding(text: string): Promise<number[]> {
  // Trim to avoid token overflow on very long entries
  const trimmed = text.slice(0, MAX_CHARS)

  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
  })

  return response.data[0].embedding
}

export function buildEmbeddingInput(title: string, body: string): string {
  return `${title}\n\n${body}`
}

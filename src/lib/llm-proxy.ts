const PROXY_URL = 'https://llm-proxy-smoky.vercel.app/api/proxy'

export async function llmProxy(
  provider: 'openai' | 'anthropic' | 'google',
  endpoint: string,
  body: Record<string, unknown>,
  token: string
) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ provider, endpoint, body }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `Proxy error: ${res.status}`)
  }

  return res
}

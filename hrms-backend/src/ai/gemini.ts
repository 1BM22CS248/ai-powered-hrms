const GROQ_API_KEY = process.env.GROQ_API_KEY!
const MODEL = 'llama-3.3-70b-versatile'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface GeminiMessage {
  role: 'user' | 'model'
  content: string
}

export async function callGemini(
  systemPrompt: string,
  messages: GeminiMessage[],
  maxTokens = 1024,
): Promise<string> {
  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.content,
    })),
  ]

  // M-3: abort Groq calls that take longer than 10 seconds
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  let response: Response
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: chatMessages,
        max_tokens: maxTokens,
        temperature: 0.4,
      }),
    })
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') throw new Error('Groq API request timed out after 10 seconds')
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`xAI API error ${response.status}: ${err}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await response.json() as any

  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Groq returned empty response')
  return text as string
}

export function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned) as T
}

// Single fetch wrapper for all LLM calls. No other file should call the Gemini API directly.

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export async function callLLM(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_AI_API_KEY
  if (!apiKey) {
    throw new Error('VITE_AI_API_KEY is not set. Add it to your .env file.')
  }

  const response = await fetch(`${BASE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText)
    throw new Error(`Gemini API error ${response.status}: ${err}`)
  }

  const data = await response.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini API')
  return text
}

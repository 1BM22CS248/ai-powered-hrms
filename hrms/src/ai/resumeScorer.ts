import { callLLM } from './client'
import { RESUME_SCORER_PROMPT } from './prompts'
import type { ResumeScore } from '../data/types'

const FALLBACK: ResumeScore = {
  score: 0,
  strengths: [],
  gaps: ['Could not parse AI response'],
  recommendation: 'Manual review required.',
  error: true,
}

export async function scoreResume(resumeText: string): Promise<ResumeScore> {
  if (!resumeText.trim()) return FALLBACK

  try {
    const raw = await callLLM(RESUME_SCORER_PROMPT(resumeText))

    // Strip markdown code fences if the model added them
    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/```$/m, '').trim()

    const parsed = JSON.parse(cleaned) as ResumeScore

    // Validate shape before trusting it
    if (typeof parsed.score !== 'number' || !Array.isArray(parsed.strengths)) {
      console.warn('[resumeScorer] Unexpected JSON shape:', parsed)
      return FALLBACK
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      strengths: (parsed.strengths ?? []).slice(0, 5),
      gaps: (parsed.gaps ?? []).slice(0, 5),
      recommendation: parsed.recommendation ?? '',
    }
  } catch (err) {
    console.error('[resumeScorer]', err)
    return FALLBACK
  }
}

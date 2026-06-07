import { callGemini, parseJson } from '../gemini'
import { RESUME_SCREENER_SYSTEM, buildResumeScreenerUserMessage } from '../prompts/resumeScreener'

export interface ResumeScreenResult {
  score: number
  recommendation: 'hire' | 'shortlist' | 'reject'
  matchedSkills: string[]
  missingSkills: string[]
  summary: string
}

export async function screenResume(
  resumeText: string,
  jobDescription: string,
): Promise<ResumeScreenResult> {
  const raw = await callGemini(
    RESUME_SCREENER_SYSTEM,
    [{ role: 'user', content: buildResumeScreenerUserMessage(resumeText, jobDescription) }],
    1024,
  )
  try {
    return parseJson<ResumeScreenResult>(raw)
  } catch {
    throw new Error(`Gemini returned invalid JSON for resume screener. Raw: ${raw}`)
  }
}

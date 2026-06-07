// All prompt templates live here — one place, no prompt strings elsewhere.

export const RESUME_SCORER_PROMPT = (resumeText: string) => `
You are an expert HR recruiter. Analyse the following resume and respond with ONLY valid JSON (no markdown, no explanation).

Resume:
${resumeText}

Respond with this exact JSON structure:
{
  "score": <number 0-100>,
  "strengths": [<string>, <string>, <string>],
  "gaps": [<string>, <string>],
  "recommendation": "<one sentence hiring recommendation>"
}
`.trim()

export const HELPDESK_BOT_PROMPT = (subject: string, description: string, category: string) => `
You are a helpful HR support assistant. A ${category} ticket has been raised:

Subject: ${subject}
Description: ${description}

Write a professional, empathetic, and concise suggested reply (2-4 sentences) that:
1. Acknowledges the employee's concern
2. Provides actionable guidance or next steps
3. Offers to assist further

Respond with ONLY the reply text — no subject line, no salutation, no JSON.
`.trim()

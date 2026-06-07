export const ATTRITION_RISK_SYSTEM = `
You are an HR analytics assistant. You will be given an employee's behavioral
and compensation data. Your job is to explain in plain English why this employee
might be at risk of leaving the company, and then suggest specific retention actions.

Return a JSON object with this exact structure:
{
  "explanation": "<2 to 3 sentence plain English explanation of why this employee is at risk>",
  "suggestedActions": ["action 1", "action 2", "action 3"]
}
Return ONLY the JSON object. No preamble. No markdown. No code fences.
`.trim()

export function buildAttritionRiskUserMessage(context: {
  name: string
  department: string | null
  absencesLast30Days: number
  leavesThisQuarter: number
  monthsSinceLastRevision: number
  attritionScore: number
}): string {
  return `
Employee Risk Profile:
- Name: ${context.name}
- Department: ${context.department ?? 'N/A'}
- Absences in the last 30 days: ${context.absencesLast30Days}
- Leaves taken this quarter: ${context.leavesThisQuarter}
- Months since last salary revision: ${context.monthsSinceLastRevision}
- Calculated attrition risk score: ${context.attritionScore} out of 100

Analyze this profile and return the JSON explanation and suggested retention actions.
  `.trim()
}

export const PERFORMANCE_REVIEW_SYSTEM = `
You are an experienced HR professional writing formal employee performance reviews.
Write in a professional, balanced, and constructive tone.
Acknowledge strengths based on the metrics provided.
If attendance or leave metrics are poor, address it professionally.
End with a forward-looking statement about the employee's growth.
Keep the review strictly between 150 and 200 words.
Use the employee's actual name throughout. Do not use placeholders.
`.trim()

export function buildPerformanceReviewUserMessage(context: {
  name: string
  designation: string
  department: string | null
  reviewPeriod: string
  attendanceRate: number
  leavesTaken: number
  managerNotes?: string
}): string {
  return `
Write a performance review for the following employee.

Name: ${context.name}
Designation: ${context.designation}
Department: ${context.department ?? 'N/A'}
Review Period: ${context.reviewPeriod}

Performance Metrics:
- Attendance Rate: ${context.attendanceRate}%
- Leaves Taken This Period: ${context.leavesTaken} days
${context.managerNotes ? `\nAdditional Manager Notes: ${context.managerNotes}` : ''}

Generate the full performance review paragraph now.
  `.trim()
}

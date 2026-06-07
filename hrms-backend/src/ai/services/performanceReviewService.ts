import { callGemini } from '../gemini'
import { PERFORMANCE_REVIEW_SYSTEM, buildPerformanceReviewUserMessage } from '../prompts/performanceReview'
import { db } from '../../db/client'
import { employees, attendance, leaveRequests } from '../../db/schema'
import { eq, and, count } from 'drizzle-orm'

export interface PerformanceReviewResult {
  review: string
  metrics: { attendanceRate: number; leavesTaken: number }
}

export async function generatePerformanceReview(
  employeeId: string,
  reviewPeriod: string,
  managerNotes?: string,
): Promise<PerformanceReviewResult> {
  const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId))
  if (!emp) throw new Error(`Employee ${employeeId} not found`)

  const [totalResult] = await db
    .select({ count: count() })
    .from(attendance)
    .where(eq(attendance.employeeId, employeeId))

  const [presentResult] = await db
    .select({ count: count() })
    .from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), eq(attendance.status, 'present')))

  const totalDays   = Number(totalResult?.count ?? 0)
  const presentDays = Number(presentResult?.count ?? 0)
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100

  const [leavesResult] = await db
    .select({ count: count() })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.employeeId, employeeId), eq(leaveRequests.status, 'approved')))

  const leavesTaken = Number(leavesResult?.count ?? 0)

  const review = await callGemini(
    PERFORMANCE_REVIEW_SYSTEM,
    [{
      role: 'user',
      content: buildPerformanceReviewUserMessage({
        name: emp.name,
        designation: emp.designation ?? emp.role,
        department: emp.department,
        reviewPeriod,
        attendanceRate,
        leavesTaken,
        managerNotes,
      }),
    }],
    512,
  )

  return { review: review.trim(), metrics: { attendanceRate, leavesTaken } }
}

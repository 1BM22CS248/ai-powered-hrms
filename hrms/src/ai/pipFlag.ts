import type { Employee, PerformanceReview, AttendanceRecord, PipRisk } from '../data/types'

// Heuristic — no LLM call.
// Risk is HIGH if:
//   - attendance rate < 75% in last 90 days, OR
//   - last 2 review ratings both < 2.5
// Risk is MEDIUM if one condition is partially met.

export function computePipRisk(
  emp: Employee,
  reviews: PerformanceReview[],
  attendance: AttendanceRecord[],
): PipRisk {
  if (emp.status === 'terminated' || emp.status === 'inactive') {
    return { risk: 'low', reasons: [] }
  }

  const reasons: string[] = []
  let riskScore = 0

  // Attendance check (last 90 days)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  const recentAtt = attendance.filter(r => r.employeeId === emp.id && r.date >= cutoffStr)
  const workDays = recentAtt.filter(r => r.status !== 'weekend' && r.status !== 'holiday')
  const present = recentAtt.filter(r => r.status === 'present' || r.status === 'late')
  const attendanceRate = workDays.length > 0 ? (present.length / workDays.length) * 100 : 100

  if (attendanceRate < 75) {
    riskScore += 2
    reasons.push(`Attendance rate ${attendanceRate.toFixed(0)}% (below 75%) in last 90 days`)
  } else if (attendanceRate < 85) {
    riskScore += 1
    reasons.push(`Attendance rate ${attendanceRate.toFixed(0)}% (below 85%) in last 90 days`)
  }

  // Performance check (last 2 reviews)
  const empReviews = reviews
    .filter(r => r.employeeId === emp.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2)

  if (empReviews.length >= 2) {
    const avgRating = empReviews.reduce((s, r) => s + r.overallRating, 0) / empReviews.length
    if (avgRating < 2) {
      riskScore += 2
      reasons.push(`Average rating ${avgRating.toFixed(1)}/5 in last 2 reviews`)
    } else if (avgRating < 2.5) {
      riskScore += 1
      reasons.push(`Average rating ${avgRating.toFixed(1)}/5 in last 2 reviews`)
    }
  } else if (empReviews.length === 1 && empReviews[0].overallRating < 2) {
    riskScore += 1
    reasons.push(`Rating ${empReviews[0].overallRating}/5 in latest review`)
  }

  const risk: 'low' | 'medium' | 'high' = riskScore >= 3 ? 'high' : riskScore >= 1 ? 'medium' : 'low'
  return { risk, reasons }
}

import type { Employee, AttendanceRecord, LeaveRequest, PerformanceReview, AttritionRisk } from '../data/types'

// Heuristic — no LLM call.
// Multi-factor score (0-100) combining: tenure, rating trend, attendance trend, leave usage.

export function computeAttritionRisk(
  emp: Employee,
  attendance: AttendanceRecord[],
  leave: LeaveRequest[],
  reviews: PerformanceReview[],
): AttritionRisk {
  if (emp.status === 'terminated' || emp.status === 'inactive') {
    return { risk: 'low', score: 0, factors: [] }
  }

  let score = 0
  const factors: string[] = []

  // 1. Tenure < 1 year → higher risk
  const joinDate = new Date(emp.joinDate)
  const tenureMonths = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  if (tenureMonths < 12) {
    score += 25
    factors.push('Tenure < 1 year')
  } else if (tenureMonths < 24) {
    score += 10
    factors.push('Tenure < 2 years')
  }

  // 2. Performance trend (last 2 reviews compared to previous 2)
  const empReviews = reviews
    .filter(r => r.employeeId === emp.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (empReviews.length >= 4) {
    const recent = empReviews.slice(0, 2).reduce((s, r) => s + r.overallRating, 0) / 2
    const older = empReviews.slice(2, 4).reduce((s, r) => s + r.overallRating, 0) / 2
    if (recent < older - 0.5) {
      score += 20
      factors.push(`Rating trend down (${older.toFixed(1)} → ${recent.toFixed(1)})`)
    }
  } else if (empReviews.length > 0 && empReviews[0].overallRating <= 2) {
    score += 15
    factors.push('Recent low performance rating')
  }

  // 3. Attendance trend declining
  const cutoff90 = new Date()
  cutoff90.setDate(cutoff90.getDate() - 90)
  const cutoff180 = new Date()
  cutoff180.setDate(cutoff180.getDate() - 180)
  const cutoff90Str = cutoff90.toISOString().split('T')[0]
  const cutoff180Str = cutoff180.toISOString().split('T')[0]

  const empAtt = attendance.filter(r => r.employeeId === emp.id)
  const recent90 = empAtt.filter(r => r.date >= cutoff90Str)
  const older90 = empAtt.filter(r => r.date >= cutoff180Str && r.date < cutoff90Str)

  function attRate(records: AttendanceRecord[]) {
    const work = records.filter(r => r.status !== 'weekend' && r.status !== 'holiday')
    const present = records.filter(r => r.status === 'present' || r.status === 'late')
    return work.length > 0 ? (present.length / work.length) * 100 : 100
  }

  const recentRate = attRate(recent90)
  const olderRate = attRate(older90)
  if (recentRate < 75) {
    score += 20
    factors.push(`Low recent attendance (${recentRate.toFixed(0)}%)`)
  } else if (recentRate < olderRate - 10) {
    score += 10
    factors.push(`Attendance declining (${olderRate.toFixed(0)}% → ${recentRate.toFixed(0)}%)`)
  }

  // 4. Leave exhausted (< 3 annual days left)
  const approvedLeave = leave.filter(l => l.employeeId === emp.id && l.status === 'approved')
  const usedAnnualDays = approvedLeave.filter(l => l.type === 'annual').reduce((s, l) => s + l.days, 0)
  if (usedAnnualDays > 18) {
    score += 10
    factors.push('Leave heavily utilised')
  }

  score = Math.min(100, score)
  const risk: 'low' | 'medium' | 'high' = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low'
  return { risk, score, factors }
}

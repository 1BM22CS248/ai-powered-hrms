import { callGemini, parseJson } from '../gemini'
import { ATTRITION_RISK_SYSTEM, buildAttritionRiskUserMessage } from '../prompts/attritionRisk'
import { db } from '../../db/client'
import { employees, attendance, leaveRequests, payroll } from '../../db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'

export interface AttritionFlag {
  employeeId: string
  name: string
  department: string | null
  attritionScore: number
  absencesLast30Days: number
  leavesThisQuarter: number
  monthsSinceLastRevision: number
}

export interface AttritionExplanation {
  explanation: string
  suggestedActions: string[]
}

export async function getAttritionFlags(): Promise<AttritionFlag[]> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30)
  const quarterStart  = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const thirtyDaysAgoStr = fmt(thirtyDaysAgo)
  const quarterStartStr  = fmt(quarterStart)

  // Single aggregation query — replaces 1 + (N * 3) queries (H-5 fix)
  const rows = await db
    .select({
      id:         employees.id,
      name:       employees.name,
      department: employees.department,
      absences: sql<number>`
        COUNT(DISTINCT CASE
          WHEN ${attendance.status} = 'absent'
           AND ${attendance.date} >= ${thirtyDaysAgoStr}
          THEN ${attendance.id}
        END)
      `.mapWith(Number),
      leaves: sql<number>`
        COUNT(DISTINCT CASE
          WHEN ${leaveRequests.status} = 'approved'
           AND ${leaveRequests.startDate} >= ${quarterStartStr}
          THEN ${leaveRequests.id}
        END)
      `.mapWith(Number),
      lastPayrollDate: sql<string | null>`MAX(${payroll.generatedAt})`,
    })
    .from(employees)
    .leftJoin(attendance,     eq(attendance.employeeId,     employees.id))
    .leftJoin(leaveRequests,  eq(leaveRequests.employeeId,  employees.id))
    .leftJoin(payroll,        eq(payroll.employeeId,        employees.id))
    .where(eq(employees.isDeleted, false))
    .groupBy(employees.id, employees.name, employees.department)

  const flags: AttritionFlag[] = []

  for (const row of rows) {
    const absencesLast30Days   = row.absences ?? 0
    const leavesThisQuarter    = row.leaves ?? 0
    const monthsSinceLastRevision = row.lastPayrollDate
      ? Math.floor((now.getTime() - new Date(row.lastPayrollDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 12

    const attritionScore = absencesLast30Days * 5 + leavesThisQuarter * 2 + monthsSinceLastRevision

    if (attritionScore > 20) {
      flags.push({
        employeeId: row.id,
        name: row.name,
        department: row.department,
        attritionScore,
        absencesLast30Days,
        leavesThisQuarter,
        monthsSinceLastRevision,
      })
    }
  }

  return flags.sort((a, b) => b.attritionScore - a.attritionScore)
}

export async function explainAttritionRisk(employeeId: string): Promise<AttritionExplanation> {
  const allFlags = await getAttritionFlags()
  const flag = allFlags.find(f => f.employeeId === employeeId)

  let context: Parameters<typeof buildAttritionRiskUserMessage>[0]

  if (!flag) {
    const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId))
    if (!emp) throw new Error(`Employee ${employeeId} not found`)
    context = {
      name: '(anonymised)',  // Don't send real name to external AI
      department: emp.department,
      absencesLast30Days: 0,
      leavesThisQuarter: 0,
      monthsSinceLastRevision: 0,
      attritionScore: 0,
    }
  } else {
    context = {
      ...flag,
      name: '(anonymised)',  // M-1: don't send real name to Groq
    }
  }

  const raw = await callGemini(
    ATTRITION_RISK_SYSTEM,
    [{ role: 'user', content: buildAttritionRiskUserMessage(context) }],
    512,
  )
  try {
    return parseJson<AttritionExplanation>(raw)
  } catch {
    throw new Error('AI returned invalid response for attrition risk analysis.')
  }
}

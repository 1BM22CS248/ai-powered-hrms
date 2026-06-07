import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { db } from '../db/client'
import { payroll, employees, attendance } from '../db/schema'
import { getWorkingDaysInMonth } from '../utils/dateHelpers'
import { AppError } from '../utils/errors'

export async function generatePayroll(
  employeeId: string,
  month: string,
  generatedBy: string,
) {
  const [emp] = await db.select().from(employees)
    .where(eq(employees.id, employeeId)).limit(1)
  if (!emp) throw new AppError('Employee not found', 404)

  const workingDays = getWorkingDaysInMonth(month)

  const [year, mon] = month.split('-').map(Number)
  const base  = new Date(year, mon - 1, 1)
  const start = format(startOfMonth(base), 'yyyy-MM-dd')
  const end   = format(endOfMonth(base),   'yyyy-MM-dd')

  const records = await db.select().from(attendance)
    .where(and(
      eq(attendance.employeeId, employeeId),
      gte(attendance.date, start),
      lte(attendance.date, end),
    ))

  const presentDays = records.filter(r => r.status === 'present' || r.status === 'wfh').length
  const halfDays    = records.filter(r => r.status === 'half_day').length
  const effectiveDays = presentDays + halfDays * 0.5

  const baseSalary   = Number(emp.salary ?? 0)
  const perDay       = baseSalary / workingDays
  const earnedSalary = perDay * effectiveDays
  const lossOfPay    = perDay * (workingDays - effectiveDays)
  const hra          = earnedSalary * 0.40
  const pfDeduction  = earnedSalary * 0.12
  const tdsDeduction = earnedSalary * 0.10
  const netPay       = earnedSalary + hra - pfDeduction - tdsDeduction - lossOfPay

  const round2 = (n: number) => n.toFixed(2)

  // INSERT ... ON CONFLICT DO NOTHING — the unique constraint on (employeeId, month)
  // guarantees idempotency even under concurrent requests
  const [record] = await db.insert(payroll).values({
    employeeId,
    month,
    workingDays: workingDays.toString(),
    presentDays: effectiveDays.toString(),
    basicSalary: round2(earnedSalary),
    hra:         round2(hra),
    pfDeduction: round2(pfDeduction),
    tdsDeduction: round2(tdsDeduction),
    lossOfPay:   round2(lossOfPay),
    netPay:      round2(netPay),
    status:      'draft',
    generatedBy,
  })
  .onConflictDoNothing()
  .returning()

  // If record is undefined the row already existed — fetch and return it
  if (!record) {
    const [existing] = await db.select().from(payroll)
      .where(and(eq(payroll.employeeId, employeeId), eq(payroll.month, month)))
      .limit(1)
    if (!existing) throw new AppError('Payroll record could not be created', 500)
    return existing
  }

  return record
}

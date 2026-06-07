import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../db/client'
import { attendance } from '../db/schema'
import { calcHoursWorked } from '../utils/dateHelpers'
import { AppError } from '../utils/errors'
import { endOfMonth, startOfMonth, format } from 'date-fns'

function today() {
  return new Date().toISOString().split('T')[0]
}

export async function checkIn(employeeId: string) {
  const date = today()
  const [existing] = await db.select().from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, date))).limit(1)
  if (existing) throw new AppError('Already checked in today', 409)

  const [record] = await db.insert(attendance).values({
    employeeId,
    date,
    checkIn: new Date(),
    status: 'present',
  }).returning()
  return record
}

export async function checkOut(employeeId: string) {
  const date = today()
  const [record] = await db.select().from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, date))).limit(1)
  if (!record) throw new AppError('No check-in found for today', 404)
  if (record.checkOut) throw new AppError('Already checked out today', 409)

  const hours = calcHoursWorked(record.checkIn!, new Date())
  const status = hours < 4 ? 'half_day' : 'present'

  const [updated] = await db.update(attendance)
    .set({ checkOut: new Date(), hoursWorked: hours.toString(), status })
    .where(eq(attendance.id, record.id))
    .returning()
  return updated
}

export async function getAttendanceByMonth(employeeId: string, month: string) {
  const [year, mon] = month.split('-').map(Number)
  const base = new Date(year, mon - 1, 1)
  const start = format(startOfMonth(base), 'yyyy-MM-dd')
  const end   = format(endOfMonth(base),   'yyyy-MM-dd')

  return db.select().from(attendance).where(
    and(
      eq(attendance.employeeId, employeeId),
      gte(attendance.date, start),
      lte(attendance.date, end),
    )
  )
}

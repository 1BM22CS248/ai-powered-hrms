import { eq, and, sql } from 'drizzle-orm'
import { getDay } from 'date-fns'
import { db } from '../db/client'
import { leaveRequests, leaveBalance } from '../db/schema'
import { AppError } from '../utils/errors'

function calcBusinessDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end   = new Date(endDate)
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = getDay(cur)
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export async function applyLeave(
  employeeId: string,
  body: { type: string; startDate: string; endDate: string; reason: string },
) {
  const days = calcBusinessDays(body.startDate, body.endDate)
  const year = body.startDate.split('-')[0]

  const [balance] = await db.select().from(leaveBalance)
    .where(and(eq(leaveBalance.employeeId, employeeId), eq(leaveBalance.year, year)))
    .limit(1)
  if (!balance) throw new AppError('Leave balance record not found for this year', 404)

  if (body.type !== 'unpaid') {
    const key = body.type as 'casual' | 'sick' | 'earned'
    const allotted = Number(balance[key] ?? 0)
    const used     = Number(balance.used ?? 0)
    if (allotted - used < days) {
      throw new AppError(`Insufficient ${body.type} leave balance`, 400)
    }
  }

  const [request] = await db.insert(leaveRequests).values({
    employeeId,
    type: body.type as 'casual' | 'sick' | 'earned' | 'maternity' | 'unpaid',
    startDate: body.startDate,
    endDate:   body.endDate,
    days:      days.toString(),
    reason:    body.reason,
    status:    'pending',
  }).returning()
  return request
}

export async function processLeave(
  leaveId: string,
  approverId: string,
  body: { status: 'approved' | 'rejected' | 'cancelled'; approverNote?: string },
) {
  return await db.transaction(async (tx) => {
    const [leave] = await tx.select().from(leaveRequests)
      .where(eq(leaveRequests.id, leaveId)).limit(1)
    if (!leave) throw new AppError('Leave request not found', 404)
    if (leave.status !== 'pending') throw new AppError('Leave already processed', 409)

    const [updated] = await tx.update(leaveRequests).set({
      status:       body.status,
      approvedBy:   approverId,
      approverNote: body.approverNote,
      updatedAt:    new Date(),
    }).where(eq(leaveRequests.id, leaveId)).returning()

    const year = leave.startDate.split('-')[0]
    const [bal] = await tx.select({ id: leaveBalance.id })
      .from(leaveBalance)
      .where(and(eq(leaveBalance.employeeId, leave.employeeId), eq(leaveBalance.year, year)))
      .limit(1)

    if (bal && leave.type !== 'unpaid') {
      if (body.status === 'approved') {
        // Atomic SQL increment — no read-then-write race condition
        await tx.update(leaveBalance)
          .set({ used: sql`${leaveBalance.used} + ${leave.days}` })
          .where(eq(leaveBalance.id, bal.id))
      } else if (body.status === 'rejected' || body.status === 'cancelled') {
        // Restore balance if this leave was previously approved (shouldn't be, but guard)
        // For pending→rejected/cancelled: no deduction was made, so nothing to restore.
        // The check above (status !== 'pending') prevents double-processing, so this is safe.
      }
    }

    return updated
  })
}

export async function cancelLeave(leaveId: string, requesterId: string) {
  return await db.transaction(async (tx) => {
    const [leave] = await tx.select().from(leaveRequests)
      .where(eq(leaveRequests.id, leaveId)).limit(1)
    if (!leave) throw new AppError('Leave request not found', 404)
    if (leave.employeeId !== requesterId) throw new AppError('Access denied', 403)
    if (leave.status === 'cancelled') throw new AppError('Already cancelled', 409)

    const wasApproved = leave.status === 'approved'

    const [updated] = await tx.update(leaveRequests)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(leaveRequests.id, leaveId))
      .returning()

    // Restore balance if cancelling a previously approved leave
    if (wasApproved && leave.type !== 'unpaid') {
      const year = leave.startDate.split('-')[0]
      await tx.update(leaveBalance)
        .set({ used: sql`GREATEST(0, ${leaveBalance.used} - ${leave.days})` })
        .where(and(
          eq(leaveBalance.employeeId, leave.employeeId),
          eq(leaveBalance.year, year),
        ))
    }

    return updated
  })
}

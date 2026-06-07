import { Router, Request, Response, NextFunction } from 'express'
import { eq, desc, inArray } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.middleware'
import { db } from '../db/client'
import { leaveRequests, payroll, employees, notificationReads } from '../db/schema'

const router = Router()
router.use(authenticate)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    const notifications: {
      id: string; userId: string; type: string; title: string
      message: string; read: boolean; link: string | null; createdAt: Date | null
    }[] = []

    if (user.role === 'employee') {
      // Leave status change notifications
      const leaves = await db.select().from(leaveRequests)
        .where(eq(leaveRequests.employeeId, user.id))
        .orderBy(desc(leaveRequests.updatedAt))
        .limit(20)

      for (const l of leaves) {
        if (l.status === 'approved') {
          notifications.push({
            id: `leave-approved-${l.id}`,
            userId: user.id,
            type: 'leave',
            title: 'Leave Request Approved',
            message: `Your ${l.type} leave from ${l.startDate} to ${l.endDate} has been approved.`,
            read: false,
            link: null,
            createdAt: l.updatedAt,
          })
        } else if (l.status === 'rejected') {
          notifications.push({
            id: `leave-rejected-${l.id}`,
            userId: user.id,
            type: 'leave',
            title: 'Leave Request Rejected',
            message: `Your ${l.type} leave from ${l.startDate} to ${l.endDate} was not approved.`,
            read: false,
            link: null,
            createdAt: l.updatedAt,
          })
        }
      }

      // Payroll credited notifications
      const payrolls = await db.select().from(payroll)
        .where(eq(payroll.employeeId, user.id))
        .orderBy(desc(payroll.generatedAt))
        .limit(12)

      for (const p of payrolls) {
        if (p.status === 'paid' || p.status === 'approved') {
          notifications.push({
            id: `payroll-${p.id}`,
            userId: user.id,
            type: 'payroll',
            title: p.status === 'paid' ? 'Salary Credited' : 'Payslip Ready',
            message: `Your payslip for ${p.month} has been ${p.status === 'paid' ? 'credited' : 'processed'}.`,
            read: false,
            link: null,
            createdAt: p.generatedAt,
          })
        }
      }
    } else {
      // HR / Admin / Manager — pending leave requests
      let pendingLeaves

      if (user.role === 'manager') {
        const reports = await db.select({ id: employees.id }).from(employees)
          .where(eq(employees.managerId, user.id))
        const ids = reports.map(r => r.id)
        pendingLeaves = ids.length > 0
          ? await db.select().from(leaveRequests)
              .where(inArray(leaveRequests.employeeId, ids))
              .orderBy(desc(leaveRequests.createdAt)).limit(20)
          : []
        pendingLeaves = pendingLeaves.filter(l => l.status === 'pending')
      } else {
        pendingLeaves = await db.select().from(leaveRequests)
          .where(eq(leaveRequests.status, 'pending'))
          .orderBy(desc(leaveRequests.createdAt)).limit(20)
      }

      // Batch-load employee names
      const empIds = [...new Set(pendingLeaves.map(l => l.employeeId))]
      const empRows = empIds.length > 0
        ? await db.select({ id: employees.id, name: employees.name }).from(employees)
            .where(inArray(employees.id, empIds))
        : []
      const empMap = new Map(empRows.map(e => [e.id, e.name]))

      for (const l of pendingLeaves) {
        notifications.push({
          id: `pending-leave-${l.id}`,
          userId: user.id,
          type: 'leave',
          title: 'Leave Request Pending',
          message: `${empMap.get(l.employeeId) ?? 'An employee'} requested ${l.type} leave from ${l.startDate} to ${l.endDate}.`,
          read: false,
          link: null,
          createdAt: l.createdAt,
        })
      }

      // Admin/HR: recent payroll generation notifications
      if (user.role === 'admin' || user.role === 'hr') {
        const recentPayroll = await db.select({
          id: payroll.id, month: payroll.month, status: payroll.status, generatedAt: payroll.generatedAt,
        }).from(payroll).orderBy(desc(payroll.generatedAt)).limit(50)

        const byMonth = new Map<string, { count: number; generatedAt: Date | null }>()
        for (const p of recentPayroll) {
          const existing = byMonth.get(p.month)
          if (!existing) {
            byMonth.set(p.month, { count: 1, generatedAt: p.generatedAt })
          } else {
            existing.count++
          }
        }

        for (const [month, { count, generatedAt }] of byMonth) {
          notifications.push({
            id: `payroll-month-${month}`,
            userId: user.id,
            type: 'payroll',
            title: 'Payroll Generated',
            message: `Payroll for ${month} has been generated for ${count} employee${count !== 1 ? 's' : ''}.`,
            read: false,
            link: null,
            createdAt: generatedAt,
          })
        }
      }
    }

    // Sort newest first
    notifications.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))

    // Apply persisted read status
    const notifIds = notifications.map(n => n.id)
    const readRows = notifIds.length > 0
      ? await db.select({ notificationId: notificationReads.notificationId })
          .from(notificationReads)
          .where(eq(notificationReads.userId, user.id))
      : []
    const readSet = new Set(readRows.map(r => r.notificationId))
    const enriched = notifications.map(n => ({ ...n, read: readSet.has(n.id) }))

    res.json({ success: true, data: enriched })
  } catch (err) { next(err) }
})

// PATCH /api/notifications/:id/read  — mark a single notification as read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.insert(notificationReads)
      .values({ userId: req.user!.id, notificationId: req.params.id })
      .onConflictDoNothing()
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router

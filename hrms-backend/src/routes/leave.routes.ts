import { Router, Request, Response, NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { validate } from '../middleware/validate.middleware'
import { applyLeaveSchema, approveLeaveSchema } from '../validators/leave.schema'
import * as svc from '../services/leave.service'
import { logAudit } from '../services/audit.service'
import { db } from '../db/client'
import { leaveRequests, leaveBalance } from '../db/schema'

const router = Router()

router.use(authenticate)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    let rows
    if (user.role === 'admin' || user.role === 'hr') {
      rows = await db.select().from(leaveRequests).orderBy(leaveRequests.createdAt)
    } else {
      rows = await db.select().from(leaveRequests)
        .where(eq(leaveRequests.employeeId, user.id))
        .orderBy(leaveRequests.createdAt)
    }
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

router.get('/balance/:empId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    // Employees can only view their own balance; managers and HR/admin can view any
    if (user.role === 'employee' && req.params.empId !== user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }
    const year = String(new Date().getFullYear())
    const [bal] = await db.select().from(leaveBalance)
      .where(and(eq(leaveBalance.employeeId, req.params.empId), eq(leaveBalance.year, year)))
      .limit(1)
    if (!bal) return res.status(404).json({ success: false, error: 'Balance not found' })
    res.json({ success: true, data: bal })
  } catch (err) { next(err) }
})

router.post('/', validate(applyLeaveSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json({ success: true, data: await svc.applyLeave(req.user!.id, req.body) })
  } catch (err) { next(err) }
})

router.put('/:id', requireRole('admin', 'hr', 'manager'), validate(approveLeaveSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await svc.processLeave(req.params.id, req.user!.id, req.body)
    await logAudit({ actor: req.user!.id, action: `LEAVE_${req.body.status.toUpperCase()}`, entityType: 'leave_request', entityId: req.params.id, newValue: req.body, ip: req.ip })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// Employees cancel their own pending or approved leave
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await svc.cancelLeave(req.params.id, req.user!.id) })
  } catch (err) { next(err) }
})

export default router

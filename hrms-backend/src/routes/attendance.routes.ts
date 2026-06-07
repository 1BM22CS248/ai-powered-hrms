import { Router, Request, Response, NextFunction } from 'express'
import { gte, lte, and, eq } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import * as svc from '../services/attendance.service'
import { db } from '../db/client'
import { attendance, employees } from '../db/schema'

const router = Router()

router.use(authenticate)

// List attendance for admin/hr/manager with optional date range + employeeId filter
router.get('/', requireRole('admin', 'hr', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, employeeId } = req.query as Record<string, string>
    const conditions = []
    if (startDate) conditions.push(gte(attendance.date, startDate))
    if (endDate)   conditions.push(lte(attendance.date, endDate))
    if (employeeId) conditions.push(eq(attendance.employeeId, employeeId))

    const rows = await db.select({
      id:          attendance.id,
      employeeId:  attendance.employeeId,
      employeeName: employees.name,
      date:        attendance.date,
      checkIn:     attendance.checkIn,
      checkOut:    attendance.checkOut,
      status:      attendance.status,
      hoursWorked: attendance.hoursWorked,
      notes:       attendance.notes,
      createdAt:   attendance.createdAt,
    }).from(attendance)
      .leftJoin(employees, eq(attendance.employeeId, employees.id))
      .where(conditions.length ? and(...conditions as [ReturnType<typeof gte>]) : undefined)
      .orderBy(attendance.date)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

router.post('/checkin', async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await svc.checkIn(req.user!.id) }) } catch (err) { next(err) }
})

router.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.checkOut(req.user!.id) }) } catch (err) { next(err) }
})

router.get('/:empId/:month', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    const { empId, month } = req.params
    if (user.role === 'employee' && user.id !== empId) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
    res.json({ success: true, data: await svc.getAttendanceByMonth(empId, month) })
  } catch (err) { next(err) }
})

export default router

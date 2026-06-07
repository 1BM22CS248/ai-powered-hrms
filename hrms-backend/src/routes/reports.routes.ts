import { Router, Request, Response, NextFunction } from 'express'
import { eq, count, sql } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { db } from '../db/client'
import { employees } from '../db/schema'

const router = Router()

router.use(authenticate, requireRole('admin', 'hr'))

router.get('/headcount', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await db
      .select({ department: employees.department, count: count() })
      .from(employees)
      .where(eq(employees.status, 'active'))
      .groupBy(employees.department)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

export default router

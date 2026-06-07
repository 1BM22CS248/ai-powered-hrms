import { Router, Request, Response, NextFunction } from 'express'
import { desc } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { db } from '../db/client'
import { auditLogs, employees } from '../db/schema'
import { eq } from 'drizzle-orm'

const router = Router()

router.use(authenticate)

// GET /api/audit?page=1&limit=50 — HR Admin only
router.get('/', requireRole('admin', 'hr'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page as string ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string ?? '50')))

    const rows = await db
      .select({
        id:         auditLogs.id,
        actor:      auditLogs.actor,
        actorName:  employees.name,
        action:     auditLogs.action,
        entityType: auditLogs.entityType,
        entityId:   auditLogs.entityId,
        oldValue:   auditLogs.oldValue,
        newValue:   auditLogs.newValue,
        ip:         auditLogs.ip,
        createdAt:  auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(employees, eq(auditLogs.actor, employees.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
})

export default router

import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../db/client'
import { onboardingTasks } from '../db/schema'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import * as svc from '../services/onboarding.service'

const router = Router()
router.use(authenticate)

// GET /api/onboarding — all tasks (admin/hr/manager only)
router.get('/', requireRole('admin', 'hr', 'manager'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const all = await db.select().from(onboardingTasks).orderBy(onboardingTasks.createdAt)
    res.json({ success: true, data: all })
  } catch (err) { next(err) }
})

// GET /api/onboarding/:employeeId — fetch (and auto-seed) tasks for an employee
router.get('/:employeeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    const { employeeId } = req.params
    if (user.role === 'employee' && user.id !== employeeId) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
    res.json({ success: true, data: await svc.getOnboardingTasks(employeeId) })
  } catch (err) { next(err) }
})

// PATCH /api/onboarding/:taskId/complete — mark a task done
router.patch('/:taskId/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await svc.completeTask(req.params.taskId, req.user!.id) })
  } catch (err) { next(err) }
})

export default router

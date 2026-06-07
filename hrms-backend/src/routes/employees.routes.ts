import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { validate } from '../middleware/validate.middleware'
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.schema'
import * as svc from '../services/employee.service'
import { logAudit } from '../services/audit.service'

const router = Router()

router.use(authenticate)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.listEmployees(req.user!.role) }) } catch (err) { next(err) }
})

router.post('/', requireRole('admin', 'hr'), validate(createEmployeeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employee, temporaryPassword } = await svc.createEmployee(req.body)
    // temporaryPassword is returned once so HR can share it; it is never stored in plain text
    res.status(201).json({ success: true, data: { employee, temporaryPassword } })
  } catch (err) { next(err) }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    // Employees can only fetch their own record
    if (user.role === 'employee' && req.params.id !== user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }
    res.json({ success: true, data: await svc.getEmployeeById(req.params.id) })
  } catch (err) { next(err) }
})

router.put('/:id', requireRole('admin', 'hr'), validate(updateEmployeeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await svc.updateEmployee(req.params.id, req.body)
    await logAudit({ actor: req.user!.id, action: 'EMPLOYEE_UPDATE', entityType: 'employee', entityId: req.params.id, newValue: req.body, ip: req.ip })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

router.delete('/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await svc.softDeleteEmployee(req.params.id)
    await logAudit({ actor: req.user!.id, action: 'EMPLOYEE_DELETE', entityType: 'employee', entityId: req.params.id, ip: req.ip })
    res.json({ success: true, data: deleted })
  } catch (err) { next(err) }
})

export default router

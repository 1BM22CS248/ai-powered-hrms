import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { eq, and, ne } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { validate } from '../middleware/validate.middleware'
import { generatePayrollSchema } from '../validators/payroll.schema'
import { generatePayroll } from '../services/payroll.service'
import { logAudit } from '../services/audit.service'
import { db } from '../db/client'
import { payroll, employees } from '../db/schema'

const router = Router()

router.use(authenticate)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    const { month, employeeId, status } = req.query as Record<string, string>

    let rows
    if (user.role === 'admin' || user.role === 'hr') {
      const allRows = await db
        .select({
          id: payroll.id, employeeId: payroll.employeeId, month: payroll.month,
          workingDays: payroll.workingDays, presentDays: payroll.presentDays,
          basicSalary: payroll.basicSalary, hra: payroll.hra, bonuses: payroll.bonuses,
          pfDeduction: payroll.pfDeduction, tdsDeduction: payroll.tdsDeduction,
          lossOfPay: payroll.lossOfPay, netPay: payroll.netPay,
          status: payroll.status, generatedBy: payroll.generatedBy, generatedAt: payroll.generatedAt,
          empName: employees.name, empDept: employees.department,
        })
        .from(payroll)
        .leftJoin(employees, eq(payroll.employeeId, employees.id))
      rows = allRows
    } else {
      const myRows = await db
        .select({
          id: payroll.id, employeeId: payroll.employeeId, month: payroll.month,
          workingDays: payroll.workingDays, presentDays: payroll.presentDays,
          basicSalary: payroll.basicSalary, hra: payroll.hra, bonuses: payroll.bonuses,
          pfDeduction: payroll.pfDeduction, tdsDeduction: payroll.tdsDeduction,
          lossOfPay: payroll.lossOfPay, netPay: payroll.netPay,
          status: payroll.status, generatedBy: payroll.generatedBy, generatedAt: payroll.generatedAt,
          empName: employees.name, empDept: employees.department,
        })
        .from(payroll)
        .leftJoin(employees, eq(payroll.employeeId, employees.id))
        .where(eq(payroll.employeeId, user.id))
      rows = myRows
    }

    if (employeeId) rows = rows.filter(r => r.employeeId === employeeId)
    if (month)      rows = rows.filter(r => r.month === month)
    if (status)     rows = rows.filter(r => r.status === status)

    res.json({ success: true, data: rows, total: rows.length })
  } catch (err) { next(err) }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    const whereClause = (user.role === 'employee')
      ? and(eq(payroll.id, req.params.id), eq(payroll.employeeId, user.id))
      : eq(payroll.id, req.params.id)

    const [row] = await db
      .select({
        id: payroll.id, employeeId: payroll.employeeId, month: payroll.month,
        workingDays: payroll.workingDays, presentDays: payroll.presentDays,
        basicSalary: payroll.basicSalary, hra: payroll.hra, bonuses: payroll.bonuses,
        pfDeduction: payroll.pfDeduction, tdsDeduction: payroll.tdsDeduction,
        lossOfPay: payroll.lossOfPay, netPay: payroll.netPay,
        status: payroll.status, generatedBy: payroll.generatedBy, generatedAt: payroll.generatedAt,
        empName: employees.name, empDept: employees.department,
      })
      .from(payroll)
      .leftJoin(employees, eq(payroll.employeeId, employees.id))
      .where(whereClause)
      .limit(1)
    if (!row) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: row })
  } catch (err) { next(err) }
})

router.patch('/:id/status', requireRole('admin', 'hr'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body as { status: 'approved' | 'paid' }
    const [updated] = await db.update(payroll)
      .set({ status })
      .where(eq(payroll.id, req.params.id))
      .returning()
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' })
    await logAudit({ actor: req.user!.id, action: `PAYROLL_STATUS_${status.toUpperCase()}`, entityType: 'payroll', entityId: req.params.id, newValue: { status }, ip: req.ip })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

router.post('/generate', requireRole('admin', 'hr'), validate(generatePayrollSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await generatePayroll(req.body.employeeId, req.body.month, req.user!.id)
    await logAudit({ actor: req.user!.id, action: 'PAYROLL_GENERATE', entityType: 'payroll', entityId: record.id, newValue: { employeeId: req.body.employeeId, month: req.body.month }, ip: req.ip })
    res.status(201).json({ success: true, data: record })
  } catch (err) { next(err) }
})

// POST /api/payroll/run-batch — generate payroll for ALL active employees for a month
// Replaces the frontend loop that silently swallowed errors (H-9 fix)
const runBatchSchema = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) })

router.post('/run-batch', requireRole('admin', 'hr'), validate(runBatchSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month } = req.body as { month: string }
    const allEmps = await db.select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.isDeleted, false), ne(employees.status, 'terminated')))

    const results: { employeeId: string; status: 'ok' | 'error'; error?: string }[] = []

    for (const emp of allEmps) {
      try {
        await generatePayroll(emp.id, month, req.user!.id)
        results.push({ employeeId: emp.id, status: 'ok' })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        results.push({ employeeId: emp.id, status: 'error', error: msg })
        console.error(`[payroll/run-batch] employee=${emp.id} month=${month} error=${msg}`)
      }
    }

    const processed = results.filter(r => r.status === 'ok').length
    const failed    = results.filter(r => r.status === 'error').length

    res.json({ success: true, data: { processed, failed, results } })
  } catch (err) { next(err) }
})

export default router

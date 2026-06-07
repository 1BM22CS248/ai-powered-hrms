import { Router, Request, Response, NextFunction } from 'express'
import { eq } from 'drizzle-orm'
import { validate } from '../middleware/validate.middleware'
import { authenticate } from '../middleware/auth.middleware'
import { loginSchema } from '../validators/auth.schema'
import { loginService } from '../services/auth.service'
import { db } from '../db/client'
import { employees } from '../db/schema'
import { signToken } from '../utils/jwt'
import { AppError } from '../utils/errors'

const router = Router()

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as 'strict' | 'lax' | 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches JWT_EXPIRES_IN default)
  path: '/',
}

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await loginService(req.body.email, req.body.password)
    // Set httpOnly cookie (H-6 fix) — token also returned in body for backward compat
    res.cookie('hrms-token', result.token, COOKIE_OPTIONS)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

// Demo login — only available outside production; never exposes credentials
router.post('/demo-login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return next(new AppError('Demo login not available in production', 403))
    }
    const { role } = req.body as { role?: string }
    if (!role || !['admin', 'manager', 'employee'].includes(role)) {
      return next(new AppError('Invalid demo role', 400))
    }

    const dbRole = role === 'admin' ? 'hr' : role
    const [emp] = await db.select().from(employees)
      .where(eq(employees.role, dbRole as 'hr' | 'manager' | 'employee'))
      .limit(1)

    if (!emp) return next(new AppError(`No demo ${role} account found`, 404))

    const token = signToken({ id: emp.id, email: emp.email, role: emp.role, empCode: emp.empCode })
    const { password: _pw, ...employee } = emp
    res.cookie('hrms-token', token, COOKIE_OPTIONS)
    res.json({ success: true, data: { token, employee } })
  } catch (err) { next(err) }
})

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('hrms-token', { path: '/' })
  res.json({ success: true })
})

router.get('/me', authenticate, (req: Request, res: Response) => {
  res.json({ success: true, data: req.user })
})

export default router

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { eq, and, desc, asc, SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { validate } from '../middleware/validate.middleware'
import { db } from '../db/client'
import { performanceReviews, employees } from '../db/schema'

const router = Router()
router.use(authenticate)

const reviewer = alias(employees, 'reviewer')

const createReviewSchema = z.object({
  employeeId:    z.string().uuid(),
  period:        z.string().min(2).max(20),
  goals:         z.number().int().min(1).max(5),
  quality:       z.number().int().min(1).max(5),
  teamwork:      z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5),
  initiative:    z.number().int().min(1).max(5),
  overallRating: z.number().int().min(1).max(5),
  comments:      z.string().default(''),
  pipFlag:       z.boolean().default(false),
})

const selectFields = {
  id:            performanceReviews.id,
  employeeId:    performanceReviews.employeeId,
  employeeName:  employees.name,
  reviewerId:    performanceReviews.reviewerId,
  reviewerName:  reviewer.name,
  period:        performanceReviews.period,
  goals:         performanceReviews.goals,
  quality:       performanceReviews.quality,
  teamwork:      performanceReviews.teamwork,
  communication: performanceReviews.communication,
  initiative:    performanceReviews.initiative,
  overallRating: performanceReviews.overallRating,
  comments:      performanceReviews.comments,
  pipFlag:       performanceReviews.pipFlag,
  createdAt:     performanceReviews.createdAt,
}

function baseQuery() {
  return db
    .select(selectFields)
    .from(performanceReviews)
    .leftJoin(employees, eq(performanceReviews.employeeId, employees.id))
    .leftJoin(reviewer, eq(performanceReviews.reviewerId, reviewer.id))
}

// GET /api/performance — all roles; employees see own
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    const { employeeId, reviewerId, period, page = '1', limit = '50' } = req.query as Record<string, string>
    const pg = Math.max(1, parseInt(page))
    const lm = Math.min(200, Math.max(1, parseInt(limit)))

    const conditions: SQL[] = []
    if (user.role === 'employee') conditions.push(eq(performanceReviews.employeeId, user.id))
    if (employeeId) conditions.push(eq(performanceReviews.employeeId, employeeId))
    if (reviewerId) conditions.push(eq(performanceReviews.reviewerId, reviewerId))
    if (period)     conditions.push(eq(performanceReviews.period, period))

    const rows = await baseQuery()
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(performanceReviews.createdAt))
      .limit(lm)
      .offset((pg - 1) * lm)

    const total = rows.length
    res.json({
      success: true,
      data: {
        data: rows,
        total,
        page: pg,
        limit: lm,
        totalPages: Math.ceil(total / lm) || 1,
      },
    })
  } catch (err) { next(err) }
})

// GET /api/performance/periods — distinct periods for filter dropdown
router.get('/periods', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await db
      .selectDistinct({ period: performanceReviews.period })
      .from(performanceReviews)
      .orderBy(asc(performanceReviews.period))
    res.json({ success: true, data: rows.map(r => r.period) })
  } catch (err) { next(err) }
})

// GET /api/performance/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    const [row] = await baseQuery()
      .where(eq(performanceReviews.id, req.params.id))
      .limit(1)
    if (!row) return res.status(404).json({ success: false, error: 'Review not found' })
    if (user.role === 'employee' && row.employeeId !== user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }
    res.json({ success: true, data: row })
  } catch (err) { next(err) }
})

// POST /api/performance — HR/Manager creates review
router.post('/', requireRole('admin', 'hr', 'manager'), validate(createReviewSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof createReviewSchema>
    const [inserted] = await db.insert(performanceReviews).values({
      ...body,
      reviewerId: req.user!.id,
    }).returning()

    // Fetch with names for the response
    const [full] = await baseQuery()
      .where(eq(performanceReviews.id, inserted.id))
      .limit(1)

    res.status(201).json({ success: true, data: full })
  } catch (err) { next(err) }
})

export default router

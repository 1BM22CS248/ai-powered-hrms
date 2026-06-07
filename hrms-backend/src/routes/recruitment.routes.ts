import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { eq, and, desc, ilike, or, SQL } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { validate } from '../middleware/validate.middleware'
import { db } from '../db/client'
import { jobPostings, candidates } from '../db/schema'

const router = Router()
router.use(authenticate)

const createJobSchema = z.object({
  title:       z.string().min(2).max(200),
  department:  z.string().optional(),
  location:    z.string().optional(),
  type:        z.enum(['full-time', 'part-time', 'contract']).default('full-time'),
  experience:  z.string().optional(),
  description: z.string().optional(),
  openings:    z.number().int().positive().default(1),
})

const createCandidateSchema = z.object({
  jobId:      z.string().uuid(),
  firstName:  z.string().min(1).max(100),
  lastName:   z.string().min(1).max(100),
  email:      z.string().email(),
  phone:      z.string().optional(),
  resumeText: z.string().default(''),
  resumeUrl:  z.string().url().optional(),
})

const updateCandidateStatusSchema = z.object({
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']),
})

const updateAiScoreSchema = z.object({
  score:          z.number().int().min(0).max(100),
  strengths:      z.array(z.string()),
  gaps:           z.array(z.string()),
  recommendation: z.string(),
})

// ─── Job Postings ─────────────────────────────────────────────────────────────

// GET /api/recruitment/jobs
router.get('/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as Record<string, string>
    const conditions: SQL[] = []
    if (status) conditions.push(eq(jobPostings.status, status as 'open' | 'closed' | 'on-hold'))

    const rows = await db
      .select()
      .from(jobPostings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(jobPostings.createdAt))

    res.json({
      success: true,
      data: {
        data:       rows,
        total:      rows.length,
        page:       1,
        limit:      rows.length,
        totalPages: 1,
      },
    })
  } catch (err) { next(err) }
})

// POST /api/recruitment/jobs — HR/Admin only
router.post('/jobs', requireRole('admin', 'hr'), validate(createJobSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [job] = await db.insert(jobPostings).values(req.body).returning()
    res.status(201).json({ success: true, data: job })
  } catch (err) { next(err) }
})

// PATCH /api/recruitment/jobs/:id — HR/Admin only
router.patch('/jobs/:id', requireRole('admin', 'hr'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body as { status: 'open' | 'closed' | 'on-hold' }
    const [updated] = await db.update(jobPostings)
      .set({ status })
      .where(eq(jobPostings.id, req.params.id))
      .returning()
    if (!updated) return res.status(404).json({ success: false, error: 'Job not found' })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// ─── Candidates ───────────────────────────────────────────────────────────────

function mapCandidate(c: Record<string, unknown>, jobTitle?: string) {
  return {
    ...c,
    jobTitle:    jobTitle ?? null,
    aiStrengths: c.aiStrengths ? JSON.parse(c.aiStrengths as string) : null,
    aiGaps:      c.aiGaps      ? JSON.parse(c.aiGaps as string)      : null,
  }
}

// GET /api/recruitment/candidates
router.get('/candidates', requireRole('admin', 'hr', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId, status, search, page = '1', limit = '50' } = req.query as Record<string, string>
    const pg = Math.max(1, parseInt(page))
    const lm = Math.min(100, Math.max(1, parseInt(limit)))

    const conditions: SQL[] = []
    if (jobId)  conditions.push(eq(candidates.jobId, jobId))
    if (status) conditions.push(eq(candidates.status, status as 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'))
    if (search) {
      const sql = or(
        ilike(candidates.firstName, `%${search}%`),
        ilike(candidates.lastName, `%${search}%`),
        ilike(candidates.email, `%${search}%`),
      )
      if (sql) conditions.push(sql)
    }

    const rows = await db
      .select({
        id: candidates.id, jobId: candidates.jobId,
        jobTitle: jobPostings.title,
        firstName: candidates.firstName, lastName: candidates.lastName,
        email: candidates.email, phone: candidates.phone,
        resumeText: candidates.resumeText, resumeUrl: candidates.resumeUrl,
        aiScore: candidates.aiScore, aiStrengths: candidates.aiStrengths,
        aiGaps: candidates.aiGaps, aiRecommendation: candidates.aiRecommendation,
        status: candidates.status, appliedAt: candidates.appliedAt,
      })
      .from(candidates)
      .leftJoin(jobPostings, eq(candidates.jobId, jobPostings.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(candidates.appliedAt))
      .limit(lm)
      .offset((pg - 1) * lm)

    const mapped = rows.map(r => mapCandidate(r as Record<string, unknown>, r.jobTitle ?? undefined))
    const total  = mapped.length

    res.json({
      success: true,
      data: {
        data: mapped,
        total,
        page: pg,
        limit: lm,
        totalPages: Math.ceil(total / lm) || 1,
      },
    })
  } catch (err) { next(err) }
})

// GET /api/recruitment/candidates/:id
router.get('/candidates/:id', requireRole('admin', 'hr', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [row] = await db
      .select({
        id: candidates.id, jobId: candidates.jobId,
        jobTitle: jobPostings.title,
        firstName: candidates.firstName, lastName: candidates.lastName,
        email: candidates.email, phone: candidates.phone,
        resumeText: candidates.resumeText, resumeUrl: candidates.resumeUrl,
        aiScore: candidates.aiScore, aiStrengths: candidates.aiStrengths,
        aiGaps: candidates.aiGaps, aiRecommendation: candidates.aiRecommendation,
        status: candidates.status, appliedAt: candidates.appliedAt,
      })
      .from(candidates)
      .leftJoin(jobPostings, eq(candidates.jobId, jobPostings.id))
      .where(eq(candidates.id, req.params.id))
      .limit(1)
    if (!row) return res.status(404).json({ success: false, error: 'Candidate not found' })
    res.json({ success: true, data: mapCandidate(row as Record<string, unknown>, row.jobTitle ?? undefined) })
  } catch (err) { next(err) }
})

// POST /api/recruitment/candidates — any authenticated user can apply
router.post('/candidates', validate(createCandidateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [candidate] = await db.insert(candidates).values(req.body).returning()
    res.status(201).json({ success: true, data: mapCandidate(candidate as Record<string, unknown>) })
  } catch (err) { next(err) }
})

// PATCH /api/recruitment/candidates/:id/status
router.patch('/candidates/:id/status', requireRole('admin', 'hr', 'manager'), validate(updateCandidateStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [updated] = await db.update(candidates)
      .set({ status: req.body.status })
      .where(eq(candidates.id, req.params.id))
      .returning()
    if (!updated) return res.status(404).json({ success: false, error: 'Candidate not found' })
    res.json({ success: true, data: mapCandidate(updated as Record<string, unknown>) })
  } catch (err) { next(err) }
})

// PATCH /api/recruitment/candidates/:id/ai-score
router.patch('/candidates/:id/ai-score', requireRole('admin', 'hr', 'manager'), validate(updateAiScoreSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { score, strengths, gaps, recommendation } = req.body as z.infer<typeof updateAiScoreSchema>
    const [updated] = await db.update(candidates)
      .set({
        aiScore:          score,
        aiStrengths:      JSON.stringify(strengths),
        aiGaps:           JSON.stringify(gaps),
        aiRecommendation: recommendation,
      })
      .where(eq(candidates.id, req.params.id))
      .returning()
    if (!updated) return res.status(404).json({ success: false, error: 'Candidate not found' })
    res.json({ success: true, data: mapCandidate(updated as Record<string, unknown>) })
  } catch (err) { next(err) }
})

export default router

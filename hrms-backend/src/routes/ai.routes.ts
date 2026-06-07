import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { validate } from '../middleware/validate.middleware'
import { resumeScreenerSchema, chatMessageSchema, performanceReviewSchema, attritionExplainSchema } from '../validators/ai.schema'
import { handleChatMessage } from '../ai/services/navigationService'
import { screenResume } from '../ai/services/resumeScreenerService'
import { generatePerformanceReview } from '../ai/services/performanceReviewService'
import { getAttritionFlags, explainAttritionRisk } from '../ai/services/attritionRiskService'

const router = Router()

router.use(authenticate)

// POST /api/ai/chat — all roles
router.post('/chat', validate(chatMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await handleChatMessage(req.user!.id, req.body.message, req.body.history)
    res.json(result)
  } catch (err) { next(err) }
})

// POST /api/ai/screen-resume — hr, admin, manager
router.post('/screen-resume', requireRole('hr', 'admin', 'manager'), validate(resumeScreenerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await screenResume(req.body.resumeText, req.body.jobDescription))
  } catch (err) { next(err) }
})

// POST /api/ai/performance-review — manager, hr, admin
router.post('/performance-review', requireRole('manager', 'hr', 'admin'), validate(performanceReviewSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await generatePerformanceReview(req.body.employeeId, req.body.reviewPeriod, req.body.managerNotes))
  } catch (err) { next(err) }
})

// GET /api/ai/attrition-risk — hr, admin, manager
router.get('/attrition-risk', requireRole('hr', 'admin', 'manager'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await getAttritionFlags())
  } catch (err) { next(err) }
})

// POST /api/ai/attrition-risk/explain — hr, admin, manager
router.post('/attrition-risk/explain', requireRole('hr', 'admin', 'manager'), validate(attritionExplainSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await explainAttritionRisk(req.body.employeeId))
  } catch (err) { next(err) }
})

export { router as aiRoutes }

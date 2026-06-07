import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { eq, and, desc, ilike, or, SQL } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { validate } from '../middleware/validate.middleware'
import { db } from '../db/client'
import { tickets, employees } from '../db/schema'
import { callGemini } from '../ai/gemini'

const router = Router()
router.use(authenticate)

// DB uses underscores; frontend types use hyphens — normalize at boundary
const toDbStatus   = (s: string) => s.replace(/-/g, '_') as 'open' | 'in_progress' | 'resolved' | 'closed'
const toDbCategory = (s: string) => s.replace(/-/g, '_') as 'payroll' | 'leave' | 'attendance' | 'policy' | 'it_support' | 'general'
const fromDb = (t: Record<string, unknown>) => ({
  ...t,
  status:   String(t.status ?? '').replace(/_/g, '-'),
  category: String(t.category ?? '').replace(/_/g, '-'),
})

const createTicketSchema = z.object({
  category:    z.enum(['payroll', 'leave', 'attendance', 'policy', 'it-support', 'general']),
  priority:    z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  subject:     z.string().min(5).max(200),
  description: z.string().min(10),
})

const updateTicketSchema = z.object({
  status:     z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
  assignedTo: z.string().uuid().optional(),
})

// GET /api/helpdesk — employees see own; HR/Admin/Manager see all
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    const { status, category, search, page = '1', limit = '50' } = req.query as Record<string, string>
    const pg = Math.max(1, parseInt(page))
    const lm = Math.min(100, Math.max(1, parseInt(limit)))

    const conditions: SQL[] = []
    if (user.role === 'employee') conditions.push(eq(tickets.employeeId, user.id))
    if (status)   conditions.push(eq(tickets.status, toDbStatus(status)))
    if (category) conditions.push(eq(tickets.category, toDbCategory(category)))
    if (search) {
      const searchSql = or(
        ilike(tickets.subject, `%${search}%`),
        ilike(tickets.description, `%${search}%`),
      )
      if (searchSql) conditions.push(searchSql)
    }

    const rows = await db
      .select({
        id:               tickets.id,
        ticketNumber:     tickets.ticketNumber,
        employeeId:       tickets.employeeId,
        employeeName:     employees.name,
        category:         tickets.category,
        priority:         tickets.priority,
        subject:          tickets.subject,
        description:      tickets.description,
        status:           tickets.status,
        assignedTo:       tickets.assignedTo,
        aiSuggestedReply: tickets.aiSuggestedReply,
        createdAt:        tickets.createdAt,
        updatedAt:        tickets.updatedAt,
        resolvedAt:       tickets.resolvedAt,
      })
      .from(tickets)
      .leftJoin(employees, eq(tickets.employeeId, employees.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tickets.createdAt))
      .limit(lm)
      .offset((pg - 1) * lm)

    const normalized = rows.map(r => fromDb(r as Record<string, unknown>))
    const total = normalized.length

    res.json({
      success: true,
      data: {
        data: normalized,
        total,
        page: pg,
        limit: lm,
        totalPages: Math.ceil(total / lm) || 1,
      },
    })
  } catch (err) { next(err) }
})

// GET /api/helpdesk/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!
    const [row] = await db
      .select({
        id: tickets.id, ticketNumber: tickets.ticketNumber,
        employeeId: tickets.employeeId, employeeName: employees.name,
        category: tickets.category, priority: tickets.priority,
        subject: tickets.subject, description: tickets.description,
        status: tickets.status, assignedTo: tickets.assignedTo,
        aiSuggestedReply: tickets.aiSuggestedReply,
        createdAt: tickets.createdAt, updatedAt: tickets.updatedAt, resolvedAt: tickets.resolvedAt,
      })
      .from(tickets)
      .leftJoin(employees, eq(tickets.employeeId, employees.id))
      .where(eq(tickets.id, req.params.id))
      .limit(1)
    if (!row) return res.status(404).json({ success: false, error: 'Ticket not found' })
    if (user.role === 'employee' && row.employeeId !== user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }
    res.json({ success: true, data: fromDb(row as Record<string, unknown>) })
  } catch (err) { next(err) }
})

// POST /api/helpdesk
router.post('/', validate(createTicketSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, ...rest } = req.body as z.infer<typeof createTicketSchema>
    const [ticket] = await db.insert(tickets).values({
      ticketNumber: `TKT-${Date.now()}`,
      employeeId:   req.user!.id,
      category:     toDbCategory(category),
      ...rest,
    }).returning()
    res.status(201).json({ success: true, data: fromDb(ticket as Record<string, unknown>) })
  } catch (err) { next(err) }
})

// PATCH /api/helpdesk/:id — update status / assignee (HR/Admin/Manager)
router.patch('/:id', requireRole('admin', 'hr', 'manager'), validate(updateTicketSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof updateTicketSchema>
    const set: Record<string, unknown> = { updatedAt: new Date() }
    if (body.status) {
      set.status = toDbStatus(body.status)
      if (body.status === 'resolved') set.resolvedAt = new Date()
    }
    if (body.assignedTo) set.assignedTo = body.assignedTo
    const [updated] = await db.update(tickets).set(set).where(eq(tickets.id, req.params.id)).returning()
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: fromDb(updated as Record<string, unknown>) })
  } catch (err) { next(err) }
})

// PATCH /api/helpdesk/:id/reply — save frontend-generated AI reply
router.patch('/:id/reply', requireRole('admin', 'hr', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reply } = req.body as { reply: string }
    if (!reply || typeof reply !== 'string') {
      return res.status(400).json({ success: false, error: 'reply is required' })
    }
    const [updated] = await db.update(tickets)
      .set({ aiSuggestedReply: reply, updatedAt: new Date() })
      .where(eq(tickets.id, req.params.id))
      .returning()
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: fromDb(updated as Record<string, unknown>) })
  } catch (err) { next(err) }
})

// POST /api/helpdesk/:id/ai-reply — backend generates AI reply via Groq
router.post('/:id/ai-reply', requireRole('admin', 'hr', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, req.params.id)).limit(1)
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' })

    const prompt = `Generate a professional, empathetic HR helpdesk reply.\n\nCategory: ${ticket.category}\nSubject: ${ticket.subject}\nDescription: ${ticket.description}\n\nReply concisely (max 150 words). Do not include personal identifying info.`
    const aiReply = await callGemini('You are a helpful HR helpdesk assistant.', [{ role: 'user', content: prompt }], 256)

    const [updated] = await db.update(tickets)
      .set({ aiSuggestedReply: aiReply, updatedAt: new Date() })
      .where(eq(tickets.id, req.params.id))
      .returning()

    res.json({ success: true, data: fromDb(updated as Record<string, unknown>) })
  } catch (err) { next(err) }
})

export default router

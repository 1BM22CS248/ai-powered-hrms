import { z } from 'zod'

export const applyLeaveSchema = z.object({
  type:      z.enum(['casual', 'sick', 'earned', 'maternity', 'unpaid']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  reason:    z.string().min(10, 'Reason must be at least 10 characters').max(500),
}).refine(
  data => data.endDate >= data.startDate,
  { message: 'End date must be on or after start date', path: ['endDate'] },
)

export const approveLeaveSchema = z.object({
  status:       z.enum(['approved', 'rejected', 'cancelled']),
  approverNote: z.string().max(300).optional(),
})

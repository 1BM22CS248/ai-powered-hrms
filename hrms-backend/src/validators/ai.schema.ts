import { z } from 'zod'

export const resumeScreenerSchema = z.object({
  resumeText:     z.string().min(100, 'Resume too short').max(5000, 'Resume too long'),
  jobDescription: z.string().min(50, 'JD too short').max(3000, 'JD too long'),
  candidateName:  z.string().optional(),
})

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role:    z.enum(['user', 'model']),
    content: z.string(),
  })).optional().default([]),
})

export const performanceReviewSchema = z.object({
  employeeId:   z.string().uuid(),
  reviewPeriod: z.string().min(1),
  managerNotes: z.string().max(500).optional(),
})

export const attritionExplainSchema = z.object({
  employeeId: z.string().uuid(),
})

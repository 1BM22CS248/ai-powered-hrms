import { z } from 'zod'

export const generatePayrollSchema = z.object({
  employeeId: z.string().uuid(),
  month:      z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM'),
})

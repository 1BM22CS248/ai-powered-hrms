import { z } from 'zod'

export const createEmployeeSchema = z.object({
  empCode:    z.string().min(2).max(20),
  name:       z.string().min(2).max(100),
  email:      z.string().email(),
  // password is optional — backend generates a secure random one if omitted
  password:   z.string().min(12).optional(),
  phone:      z.string().optional(),
  role:       z.enum(['admin', 'hr', 'manager', 'employee']).default('employee'),
  department: z.string().optional(),
  designation: z.string().optional(),
  joiningDate: z.string().optional(),
  salary:     z.number().positive().optional(),
  managerId:  z.string().uuid().optional(),
})

export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .omit({ password: true })

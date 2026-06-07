import {
  pgTable, pgEnum, uuid, varchar,
  timestamp, numeric, unique,
} from 'drizzle-orm/pg-core'
import { employees } from './employees'

export const payrollStatusEnum = pgEnum('payroll_status', ['draft', 'approved', 'paid'])

export const payroll = pgTable('payroll', {
  id:           uuid('id').primaryKey().defaultRandom(),
  employeeId:   uuid('employee_id').notNull().references(() => employees.id),
  month:        varchar('month', { length: 7 }).notNull(),
  workingDays:  numeric('working_days', { precision: 4, scale: 1 }),
  presentDays:  numeric('present_days', { precision: 4, scale: 1 }),
  basicSalary:  numeric('basic_salary', { precision: 12, scale: 2 }),
  hra:          numeric('hra', { precision: 12, scale: 2 }),
  bonuses:      numeric('bonuses').default('0'),
  pfDeduction:  numeric('pf_deduction', { precision: 12, scale: 2 }),
  tdsDeduction: numeric('tds_deduction', { precision: 12, scale: 2 }),
  lossOfPay:    numeric('loss_of_pay', { precision: 12, scale: 2 }).default('0'),
  netPay:       numeric('net_pay', { precision: 12, scale: 2 }),
  status:       payrollStatusEnum('status').default('draft'),
  generatedBy:  uuid('generated_by').references(() => employees.id),
  generatedAt:  timestamp('generated_at').defaultNow(),
}, table => ({
  uniqEmpMonth: unique('payroll_emp_month_uidx').on(table.employeeId, table.month),
}))

export type Payroll    = typeof payroll.$inferSelect
export type NewPayroll = typeof payroll.$inferInsert

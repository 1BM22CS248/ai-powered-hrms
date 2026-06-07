import {
  pgTable, pgEnum, uuid, varchar,
  timestamp, date, numeric,
} from 'drizzle-orm/pg-core'
import { employees } from './employees'

export const leaveTypeEnum = pgEnum('leave_type', [
  'casual', 'sick', 'earned', 'maternity', 'unpaid',
])

export const leaveStatusEnum = pgEnum('leave_status', [
  'pending', 'approved', 'rejected', 'cancelled',
])

export const leaveRequests = pgTable('leave_requests', {
  id:           uuid('id').primaryKey().defaultRandom(),
  employeeId:   uuid('employee_id').notNull().references(() => employees.id),
  type:         leaveTypeEnum('type').notNull(),
  startDate:    date('start_date').notNull(),
  endDate:      date('end_date').notNull(),
  days:         numeric('days', { precision: 4, scale: 1 }),
  reason:       varchar('reason', { length: 500 }),
  status:       leaveStatusEnum('status').default('pending').notNull(),
  approvedBy:   uuid('approved_by').references(() => employees.id),
  approverNote: varchar('approver_note', { length: 300 }),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
})

export const leaveBalance = pgTable('leave_balance', {
  id:         uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  year:       varchar('year', { length: 4 }).notNull(),
  casual:     numeric('casual').default('12'),
  sick:       numeric('sick').default('10'),
  earned:     numeric('earned').default('15'),
  used:       numeric('used').default('0'),
})

export type LeaveRequest    = typeof leaveRequests.$inferSelect
export type NewLeaveRequest = typeof leaveRequests.$inferInsert
export type LeaveBalance    = typeof leaveBalance.$inferSelect
export type NewLeaveBalance = typeof leaveBalance.$inferInsert

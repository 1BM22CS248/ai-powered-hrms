import {
  pgTable, pgEnum, uuid, varchar, text, timestamp,
} from 'drizzle-orm/pg-core'
import { employees } from './employees'

export const ticketCategoryEnum = pgEnum('ticket_category', [
  'payroll', 'leave', 'attendance', 'policy', 'it_support', 'general',
])

export const ticketPriorityEnum = pgEnum('ticket_priority', [
  'low', 'medium', 'high', 'urgent',
])

export const ticketStatusEnum = pgEnum('ticket_status', [
  'open', 'in_progress', 'resolved', 'closed',
])

export const tickets = pgTable('tickets', {
  id:               uuid('id').primaryKey().defaultRandom(),
  ticketNumber:     varchar('ticket_number', { length: 20 }).notNull().unique(),
  employeeId:       uuid('employee_id').notNull().references(() => employees.id),
  category:         ticketCategoryEnum('category').notNull().default('general'),
  priority:         ticketPriorityEnum('priority').notNull().default('medium'),
  subject:          varchar('subject', { length: 200 }).notNull(),
  description:      text('description').notNull(),
  status:           ticketStatusEnum('status').notNull().default('open'),
  assignedTo:       uuid('assigned_to').references(() => employees.id),
  aiSuggestedReply: text('ai_suggested_reply'),
  createdAt:        timestamp('created_at').defaultNow(),
  updatedAt:        timestamp('updated_at').defaultNow(),
  resolvedAt:       timestamp('resolved_at'),
})

export type Ticket    = typeof tickets.$inferSelect
export type NewTicket = typeof tickets.$inferInsert

import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { employees } from './employees'

export const auditLogs = pgTable('audit_logs', {
  id:         uuid('id').primaryKey().defaultRandom(),
  actor:      uuid('actor').notNull().references(() => employees.id),
  action:     varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId:   varchar('entity_id', { length: 100 }).notNull(),
  oldValue:   text('old_value'),
  newValue:   text('new_value'),
  ip:         varchar('ip', { length: 45 }),
  createdAt:  timestamp('created_at').defaultNow(),
})

export type AuditLog    = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert

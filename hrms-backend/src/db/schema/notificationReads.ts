import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core'
import { employees } from './employees'

// Tracks which dynamically-generated notification IDs have been read by which user.
// Notification IDs are synthetic strings like "leave-approved-<uuid>" computed at
// query time from leave_requests / payroll — they are never stored in a separate
// notifications table, so we only need to record the read event.
export const notificationReads = pgTable('notification_reads', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  notificationId: varchar('notification_id', { length: 100 }).notNull(),
  readAt:         timestamp('read_at').defaultNow(),
}, table => ({
  uniqUserNotif: unique().on(table.userId, table.notificationId),
}))

export type NotificationRead    = typeof notificationReads.$inferSelect
export type NewNotificationRead = typeof notificationReads.$inferInsert

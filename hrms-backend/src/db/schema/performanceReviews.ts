import {
  pgTable, uuid, varchar, text, integer, boolean, timestamp,
} from 'drizzle-orm/pg-core'
import { employees } from './employees'

export const performanceReviews = pgTable('performance_reviews', {
  id:            uuid('id').primaryKey().defaultRandom(),
  employeeId:    uuid('employee_id').notNull().references(() => employees.id),
  reviewerId:    uuid('reviewer_id').notNull().references(() => employees.id),
  period:        varchar('period', { length: 20 }).notNull(),  // e.g. "Q1 2025"
  goals:         integer('goals').notNull(),
  quality:       integer('quality').notNull(),
  teamwork:      integer('teamwork').notNull(),
  communication: integer('communication').notNull(),
  initiative:    integer('initiative').notNull(),
  overallRating: integer('overall_rating').notNull(),  // 1-5
  comments:      text('comments').default(''),
  pipFlag:       boolean('pip_flag').default(false),
  createdAt:     timestamp('created_at').defaultNow(),
})

export type PerformanceReview    = typeof performanceReviews.$inferSelect
export type NewPerformanceReview = typeof performanceReviews.$inferInsert

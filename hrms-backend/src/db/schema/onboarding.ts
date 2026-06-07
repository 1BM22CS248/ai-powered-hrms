import {
  pgTable, pgEnum, uuid, varchar, text, boolean, timestamp, date,
} from 'drizzle-orm/pg-core'
import { employees } from './employees'

export const onboardingCategoryEnum = pgEnum('onboarding_category', [
  'documents', 'setup', 'training', 'introduction',
])

export const onboardingTasks = pgTable('onboarding_tasks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  employeeId:  uuid('employee_id').notNull().references(() => employees.id),
  title:       varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  category:    onboardingCategoryEnum('category').notNull(),
  completed:   boolean('completed').notNull().default(false),
  dueDate:     date('due_date').notNull(),
  completedAt: timestamp('completed_at'),
  createdAt:   timestamp('created_at').defaultNow(),
})

export type OnboardingTask    = typeof onboardingTasks.$inferSelect
export type NewOnboardingTask = typeof onboardingTasks.$inferInsert

import {
  pgTable, pgEnum, uuid, varchar, boolean,
  timestamp, date, numeric, type AnyPgColumn,
} from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'hr', 'manager', 'employee'])
export const empStatusEnum = pgEnum('emp_status', ['active', 'on-leave', 'inactive', 'terminated'])

export const employees = pgTable('employees', {
  id:           uuid('id').primaryKey().defaultRandom(),
  empCode:      varchar('emp_code', { length: 20 }).notNull().unique(),
  name:         varchar('name', { length: 100 }).notNull(),
  email:        varchar('email', { length: 150 }).notNull().unique(),
  password:     varchar('password', { length: 255 }).notNull(),
  phone:        varchar('phone', { length: 15 }),
  role:         roleEnum('role').default('employee').notNull(),
  department:   varchar('department', { length: 100 }),
  designation:  varchar('designation', { length: 100 }),
  joiningDate:  date('joining_date'),
  salary:       numeric('salary', { precision: 12, scale: 2 }),
  managerId:    uuid('manager_id').references((): AnyPgColumn => employees.id),
  status:       empStatusEnum('status').default('active').notNull(),
  isDeleted:    boolean('is_deleted').default(false),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
})

export type Employee    = typeof employees.$inferSelect
export type NewEmployee = typeof employees.$inferInsert

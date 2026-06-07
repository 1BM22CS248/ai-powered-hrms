import {
  pgTable, pgEnum, uuid, varchar,
  timestamp, date, numeric, unique,
} from 'drizzle-orm/pg-core'
import { employees } from './employees'

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present', 'absent', 'half_day', 'wfh', 'holiday', 'weekend',
])

export const attendance = pgTable('attendance', {
  id:          uuid('id').primaryKey().defaultRandom(),
  employeeId:  uuid('employee_id').notNull().references(() => employees.id),
  date:        date('date').notNull(),
  checkIn:     timestamp('check_in'),
  checkOut:    timestamp('check_out'),
  status:      attendanceStatusEnum('status').default('present'),
  hoursWorked: numeric('hours_worked', { precision: 5, scale: 2 }),
  notes:       varchar('notes', { length: 500 }),
  createdAt:   timestamp('created_at').defaultNow(),
}, table => ({
  uniqEmpDate: unique().on(table.employeeId, table.date),
}))

export type Attendance    = typeof attendance.$inferSelect
export type NewAttendance = typeof attendance.$inferInsert

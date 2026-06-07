import bcrypt from 'bcryptjs'
import { db } from '../../src/db/client'
import { employees, leaveBalance } from '../../src/db/schema'

export async function seedEmployee(overrides: Record<string, unknown> = {}) {
  const hash = await bcrypt.hash('password123', 10)
  const year = new Date().getFullYear().toString()

  const defaults = {
    empCode:    `TEST-${Date.now()}`,
    name:       'Test User',
    email:      `test-${Date.now()}@hrms.com`,
    password:   hash,
    role:       'employee' as const,
    department: 'Engineering',
    designation: 'SDE I',
    salary:     '50000',
    status:     'active' as const,
  }

  const [emp] = await db.insert(employees)
    .values({ ...defaults, ...overrides })
    .returning()

  await db.insert(leaveBalance).values({
    employeeId: emp.id,
    year,
    casual: '12',
    sick:   '10',
    earned: '15',
    used:   '0',
  })

  return emp
}

export async function cleanDb() {
  await db.execute(
    `TRUNCATE TABLE payroll, leave_balance, leave_requests, attendance, employees RESTART IDENTITY CASCADE`
  )
}

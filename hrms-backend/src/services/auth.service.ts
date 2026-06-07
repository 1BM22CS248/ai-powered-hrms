import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { employees } from '../db/schema'
import { signToken } from '../utils/jwt'
import { AppError } from '../utils/errors'

export async function loginService(email: string, password: string) {
  const [emp] = await db
    .select()
    .from(employees)
    .where(eq(employees.email, email))
    .limit(1)

  if (!emp || emp.isDeleted) {
    throw new AppError('Invalid credentials', 401)
  }
  if (emp.status !== 'active') {
    throw new AppError('Account is inactive', 403)
  }

  const valid = await bcrypt.compare(password, emp.password)
  if (!valid) throw new AppError('Invalid credentials', 401)

  const token = signToken({
    id: emp.id,
    email: emp.email,
    role: emp.role,
    empCode: emp.empCode,
  })

  const { password: _pw, ...employee } = emp
  return { token, employee }
}

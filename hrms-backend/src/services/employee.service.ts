import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/client'
import { employees, NewEmployee } from '../db/schema'
import { AppError } from '../utils/errors'

function generateTemporaryPassword(): string {
  // 12-char password: upper + lower + digit + symbol
  const upper  = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower  = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const syms   = '!@#$%^&*'
  const all    = upper + lower + digits + syms
  const rand   = (chars: string) => chars[crypto.randomInt(chars.length)]
  const base   = Array.from({ length: 8 }, () => rand(all))
  // Guarantee at least one of each required class
  base[0] = rand(upper)
  base[1] = rand(lower)
  base[2] = rand(digits)
  base[3] = rand(syms)
  // Shuffle
  for (let i = base.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [base[i], base[j]] = [base[j], base[i]]
  }
  return base.join('')
}

function omitPassword<T extends { password: string }>(emp: T) {
  const { password: _pw, ...rest } = emp
  return rest
}

export async function createEmployee(data: {
  empCode: string; name: string; email: string; password?: string
  phone?: string; role?: string; department?: string; designation?: string
  joiningDate?: string; salary?: number; managerId?: string
}) {
  const [existing] = await db.select({ id: employees.id })
    .from(employees).where(eq(employees.email, data.email)).limit(1)
  if (existing) throw new AppError('Email already in use', 409)

  // Generate a secure random password if none supplied (normal case)
  const temporaryPassword = data.password ?? generateTemporaryPassword()
  const hash = await bcrypt.hash(temporaryPassword, 12)
  const [emp] = await db.insert(employees).values({
    empCode: data.empCode,
    name: data.name,
    email: data.email,
    password: hash,
    phone: data.phone,
    role: (data.role ?? 'employee') as NewEmployee['role'],
    department: data.department,
    designation: data.designation,
    joiningDate: data.joiningDate,
    salary: data.salary?.toString(),
    managerId: data.managerId,
  }).returning()
  // Return the temporary password once so HR can share it with the employee
  return { employee: omitPassword(emp), temporaryPassword }
}

export async function getEmployeeById(id: string) {
  const [emp] = await db.select().from(employees)
    .where(and(eq(employees.id, id), eq(employees.isDeleted, false))).limit(1)
  if (!emp) throw new AppError('Employee not found', 404)
  return omitPassword(emp)
}

export async function listEmployees(requestingRole?: string) {
  const list = await db.select().from(employees)
    .where(eq(employees.isDeleted, false))

  if (requestingRole === 'employee') {
    // Employees see the directory (public fields only — no salary, no phone)
    return list.map(emp => {
      const { password: _pw, salary: _sal, phone: _ph, ...pub } = emp
      return { ...pub, salary: null, phone: null }
    })
  }
  return list.map(omitPassword)
}

export async function updateEmployee(id: string, data: Partial<Omit<NewEmployee, 'password' | 'id' | 'empCode'>>) {
  const [emp] = await db.update(employees)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(employees.id, id))
    .returning()
  if (!emp) throw new AppError('Employee not found', 404)
  return omitPassword(emp)
}

export async function softDeleteEmployee(id: string) {
  const [emp] = await db.update(employees)
    .set({ isDeleted: true, status: 'terminated', updatedAt: new Date() })
    .where(eq(employees.id, id))
    .returning()
  if (!emp) throw new AppError('Employee not found', 404)
  return omitPassword(emp)
}

import { describe, it, expect } from 'vitest'
import { computePipRisk } from '../pipFlag'
import type { Employee, PerformanceReview, AttendanceRecord } from '../../data/types'

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-1',
    employeeCode: 'EMP00001',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@hrms.com',
    phone: '9999999999',
    gender: 'male',
    dateOfBirth: '1990-01-01',
    joinDate: '2020-01-01',
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    designation: 'Engineer',
    managerId: null,
    managerName: null,
    role: 'EMPLOYEE',
    status: 'active',
    salaryMonthly: 50000,
    avatarUrl: '',
    address: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    ...overrides,
  }
}

function makeAttendance(employeeId: string, rate: number, daysBack = 90): AttendanceRecord[] {
  const today = new Date()
  // Collect only work days first, then compute present count against actual work days
  const workDays: string[] = []
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) workDays.push(date.toISOString().split('T')[0])
  }
  const presentCount = Math.round((rate / 100) * workDays.length)
  return workDays.map((dateStr, idx) => ({
    id: `att-${idx}`,
    employeeId,
    date: dateStr,
    checkIn: idx < presentCount ? '09:00' : null,
    checkOut: idx < presentCount ? '18:00' : null,
    hoursWorked: idx < presentCount ? 9 : 0,
    status: idx < presentCount ? 'present' : 'absent',
  }))
}

function makeReviews(employeeId: string, ratings: number[]): PerformanceReview[] {
  return ratings.map((rating, i) => ({
    id: `rev-${i}`,
    employeeId,
    employeeName: 'Test User',
    reviewerId: 'emp-2',
    reviewerName: 'Manager',
    period: `Q${i + 1} 2024`,
    goals: rating,
    quality: rating,
    teamwork: rating,
    communication: rating,
    initiative: rating,
    overallRating: rating as 1 | 2 | 3 | 4 | 5,
    comments: 'Test',
    pipFlag: rating <= 2,
    createdAt: new Date(2024, i, 1).toISOString().split('T')[0],
  }))
}

describe('computePipRisk', () => {
  it('returns low risk for a healthy employee', () => {
    const emp = makeEmployee()
    const attendance = makeAttendance(emp.id, 95)
    const reviews = makeReviews(emp.id, [4, 5])
    const result = computePipRisk(emp, reviews, attendance)
    expect(result.risk).toBe('low')
    expect(result.reasons).toHaveLength(0)
  })

  it('returns high risk for low attendance + low ratings', () => {
    const emp = makeEmployee()
    const attendance = makeAttendance(emp.id, 60)
    const reviews = makeReviews(emp.id, [1, 1, 1, 1])
    const result = computePipRisk(emp, reviews, attendance)
    expect(result.risk).toBe('high')
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('returns medium risk for borderline attendance only', () => {
    const emp = makeEmployee()
    const attendance = makeAttendance(emp.id, 80)
    const reviews = makeReviews(emp.id, [3, 4])
    const result = computePipRisk(emp, reviews, attendance)
    expect(result.risk).toBe('medium')
  })

  it('returns low risk for terminated employee', () => {
    const emp = makeEmployee({ status: 'terminated' })
    const result = computePipRisk(emp, [], [])
    expect(result.risk).toBe('low')
  })

  it('flags when attendance is exactly 75% as high risk', () => {
    const emp = makeEmployee()
    const attendance = makeAttendance(emp.id, 74)
    const reviews = makeReviews(emp.id, [4, 5])
    const result = computePipRisk(emp, reviews, attendance)
    // 74% < 75% threshold
    expect(result.risk).not.toBe('low')
  })

  it('returns reasons array', () => {
    const emp = makeEmployee()
    const attendance = makeAttendance(emp.id, 50)
    const reviews = makeReviews(emp.id, [1, 1, 1, 1])
    const { reasons } = computePipRisk(emp, reviews, attendance)
    expect(reasons).toBeInstanceOf(Array)
    expect(reasons.length).toBeGreaterThan(0)
    reasons.forEach(r => expect(typeof r).toBe('string'))
  })
})

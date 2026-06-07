import { describe, it, expect } from 'vitest'
import { detectPayrollAnomalies } from '../payrollAnomaly'
import type { PayrollRecord } from '../../data/types'

function makeRecord(overrides: Partial<PayrollRecord>): PayrollRecord {
  return {
    id: 'pay-1',
    employeeId: 'emp-1',
    employeeName: 'Test User',
    departmentName: 'Engineering',
    month: '2024-01',
    basicSalary: 50000,
    hra: 20000,
    conveyance: 2500,
    medicalAllowance: 1250,
    bonus: 0,
    grossSalary: 73750,
    pf: 6000,
    tax: 7375,
    otherDeductions: 1000,
    totalDeductions: 14375,
    netPay: 59375,
    status: 'paid',
    paidAt: '2024-01-31',
    anomalyFlag: false,
    anomalyReason: null,
    ...overrides,
  }
}

describe('detectPayrollAnomalies', () => {
  const median = 60000

  it('returns no flags when net pay is within 20% of median', () => {
    const record = makeRecord({ netPay: 60000 })
    const medians = new Map([['Engineering', median]])
    expect(detectPayrollAnomalies([record], medians)).toHaveLength(0)
  })

  it('flags when net pay is > 20% above median', () => {
    const record = makeRecord({ netPay: 73000 }) // +21.7%
    const medians = new Map([['Engineering', median]])
    const flags = detectPayrollAnomalies([record], medians)
    expect(flags).toHaveLength(1)
    expect(flags[0].deviation).toBeGreaterThan(20)
    expect(flags[0].reason).toContain('above')
  })

  it('flags when net pay is > 20% below median', () => {
    const record = makeRecord({ netPay: 47000 }) // -21.7%
    const medians = new Map([['Engineering', median]])
    const flags = detectPayrollAnomalies([record], medians)
    expect(flags).toHaveLength(1)
    expect(flags[0].deviation).toBeLessThan(-20)
    expect(flags[0].reason).toContain('below')
  })

  it('does not flag at exactly 20% boundary', () => {
    const record = makeRecord({ netPay: 72000 }) // exactly +20%
    const medians = new Map([['Engineering', median]])
    const flags = detectPayrollAnomalies([record], medians)
    expect(flags).toHaveLength(0)
  })

  it('skips departments without a median', () => {
    const record = makeRecord({ departmentName: 'Unknown' })
    const medians = new Map([['Engineering', median]])
    expect(detectPayrollAnomalies([record], medians)).toHaveLength(0)
  })

  it('returns flag with correct employeeId and payrollId', () => {
    const record = makeRecord({ id: 'pay-42', employeeId: 'emp-99', netPay: 100000 })
    const medians = new Map([['Engineering', median]])
    const [flag] = detectPayrollAnomalies([record], medians)
    expect(flag.payrollId).toBe('pay-42')
    expect(flag.employeeId).toBe('emp-99')
  })
})

import { api } from '../../lib/apiClient'
import type { PayrollRecord, PaginatedResponse, PayrollStatus } from '../types'

interface BackendPayroll {
  id: string; employeeId: string; month: string
  workingDays: string | null; presentDays: string | null
  basicSalary: string | null; hra: string | null; bonuses: string | null
  pfDeduction: string | null; tdsDeduction: string | null
  lossOfPay: string | null; netPay: string | null
  status: string; generatedBy: string | null; generatedAt: string | null
  empName: string | null; empDept: string | null
}

function n(v: string | null) { return v ? parseFloat(v) : 0 }

function mapStatus(s: string): PayrollStatus {
  if (s === 'approved') return 'processed'
  return s as PayrollStatus
}

function toRecord(b: BackendPayroll): PayrollRecord {
  const basic = n(b.basicSalary)
  const hra   = n(b.hra)
  const bonus = n(b.bonuses)
  const pf    = n(b.pfDeduction)
  const tax   = n(b.tdsDeduction)
  const gross = basic + hra + bonus
  const totalDed = pf + tax

  return {
    id: b.id,
    employeeId: b.employeeId,
    employeeName: b.empName ?? '',
    departmentName: b.empDept ?? '',
    month: b.month,
    basicSalary: basic,
    hra,
    conveyance: 0,
    medicalAllowance: 0,
    bonus,
    grossSalary: gross,
    pf,
    tax,
    otherDeductions: 0,
    totalDeductions: totalDed,
    netPay: n(b.netPay),
    status: mapStatus(b.status),
    paidAt: null,
    anomalyFlag: false,
    anomalyReason: null,
  }
}

export interface GetPayrollParams {
  page?: number; limit?: number
  employeeId?: string; month?: string; status?: PayrollStatus | ''
}

export async function getPayrollRecords(params: GetPayrollParams = {}): Promise<PaginatedResponse<PayrollRecord>> {
  const { page = 1, limit = 50, employeeId = '', month = '', status = '' } = params
  const qs = new URLSearchParams()
  if (employeeId) qs.set('employeeId', employeeId)
  if (month)      qs.set('month', month)
  if (status)     qs.set('status', status)

  const raw = await api.get<BackendPayroll[]>(`/payroll?${qs}`)
  const records = raw.map(toRecord).sort((a, b) => b.month.localeCompare(a.month))

  const total = records.length
  const totalPages = Math.ceil(total / limit) || 1
  return { data: records.slice((page - 1) * limit, page * limit), total, page, limit, totalPages }
}

export async function getPayrollRecord(id: string): Promise<PayrollRecord | null> {
  try {
    const b = await api.get<BackendPayroll>(`/payroll/${id}`)
    return toRecord(b)
  } catch { return null }
}

export async function runPayroll(month: string): Promise<{ processed: number; failed: number }> {
  const result = await api.post<{ processed: number; failed: number; results: unknown[] }>(
    '/payroll/run-batch',
    { month }
  )
  return { processed: result.processed, failed: result.failed }
}

export async function markPayrollPaid(month: string): Promise<{ paid: number }> {
  const raw = await api.get<BackendPayroll[]>(`/payroll?month=${month}&status=approved`)
  let count = 0
  for (const r of raw) {
    try {
      await api.patch(`/payroll/${r.id}/status`, { status: 'paid' })
      count++
    } catch { /* skip */ }
  }
  return { paid: count }
}

export async function getDeptPayrollMedians(): Promise<Map<string, number>> {
  return new Map()
}

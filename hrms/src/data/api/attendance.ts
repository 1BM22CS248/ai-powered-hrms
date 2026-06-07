import { api } from '../../lib/apiClient'
import type { AttendanceRecord, PaginatedResponse, AttendanceStatus } from '../types'

interface BackendRecord {
  id: string; employeeId: string; date: string
  status: string; checkIn: string | null; checkOut: string | null
  hoursWorked: string | null; notes: string | null; createdAt: string
}

function toHHmm(ts: string | null): string | null {
  if (!ts) return null
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function mapStatus(s: string): AttendanceStatus {
  if (s === 'half_day') return 'half-day'
  if (s === 'wfh') return 'present'
  return s as AttendanceStatus
}

function toRecord(b: BackendRecord): AttendanceRecord {
  return {
    id: b.id,
    employeeId: b.employeeId,
    date: b.date,
    checkIn: toHHmm(b.checkIn),
    checkOut: toHHmm(b.checkOut),
    hoursWorked: b.hoursWorked ? parseFloat(b.hoursWorked) : 0,
    status: mapStatus(b.status),
  }
}

export interface GetAttendanceParams {
  page?: number
  limit?: number
  employeeId?: string
  departmentId?: string
  status?: AttendanceStatus | ''
  startDate?: string
  endDate?: string
}

export async function getAttendance(params: GetAttendanceParams = {}): Promise<PaginatedResponse<AttendanceRecord>> {
  const { page = 1, limit = 50, employeeId = '', startDate = '', endDate = '' } = params
  const qs = new URLSearchParams()
  if (startDate)  qs.set('startDate', startDate)
  if (endDate)    qs.set('endDate', endDate)
  if (employeeId) qs.set('employeeId', employeeId)

  const raw = await api.get<BackendRecord[]>(`/attendance?${qs}`)
  let records = raw.map(toRecord)

  if (params.status) records = records.filter(r => r.status === params.status)

  records = records.sort((a, b) => b.date.localeCompare(a.date))
  const total = records.length
  const totalPages = Math.ceil(total / limit) || 1
  const data = records.slice((page - 1) * limit, page * limit)
  return { data, total, page, limit, totalPages }
}

export async function getEmployeeAttendance(employeeId: string): Promise<AttendanceRecord[]> {
  const month = new Date().toISOString().slice(0, 7)
  const raw = await api.get<BackendRecord[]>(`/attendance/${employeeId}/${month}`)
  return raw.map(toRecord).sort((a, b) => b.date.localeCompare(a.date))
}

export interface AttendanceSummary {
  employeeId: string
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  halfDays: number
  attendanceRate: number
}

export async function getAttendanceSummary(employeeId: string, days = 90): Promise<AttendanceSummary> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const startDate = start.toISOString().split('T')[0]
  const endDate = end.toISOString().split('T')[0]

  // fetch 3 months worth by querying each month
  const months: string[] = []
  const d = new Date(start)
  while (d <= end) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() + 1)
  }

  const allRecords: AttendanceRecord[] = []
  for (const month of [...new Set(months)]) {
    try {
      const raw = await api.get<BackendRecord[]>(`/attendance/${employeeId}/${month}`)
      allRecords.push(...raw.map(toRecord))
    } catch { /* month may not have data */ }
  }

  const records = allRecords.filter(r => r.date >= startDate && r.date <= endDate)
  const workDays = records.filter(r => r.status !== 'weekend' && r.status !== 'holiday')

  return {
    employeeId,
    totalDays: workDays.length,
    presentDays: records.filter(r => r.status === 'present').length,
    absentDays: records.filter(r => r.status === 'absent').length,
    lateDays: records.filter(r => r.status === 'late').length,
    halfDays: records.filter(r => r.status === 'half-day').length,
    attendanceRate: workDays.length > 0
      ? Math.round(records.filter(r => r.status === 'present' || r.status === 'late').length / workDays.length * 100)
      : 0,
  }
}

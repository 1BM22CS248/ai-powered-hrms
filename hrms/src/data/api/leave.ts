import { api } from '../../lib/apiClient'
import type { LeaveRequest, LeaveBalance, PaginatedResponse, LeaveStatus, LeaveType } from '../types'
import { getEmployees } from './employees'

interface BackendLeaveRequest {
  id: string; employeeId: string; type: string; startDate: string; endDate: string
  days: string | null; reason: string | null; status: string
  approvedBy: string | null; approverNote: string | null
  createdAt: string; updatedAt: string
}

interface BackendLeaveBalance {
  id: string; employeeId: string; year: string
  casual: string | null; sick: string | null; earned: string | null; used: string | null
}

function mapLeaveType(t: string): LeaveType {
  if (t === 'earned') return 'annual'
  return t as LeaveType
}

async function toLeaveRequest(b: BackendLeaveRequest): Promise<LeaveRequest> {
  let employeeName = ''
  let departmentName = ''
  let reviewedBy: string | null = null

  try {
    const emps = await getEmployees({ limit: 200 })
    const emp = emps.data.find(e => e.id === b.employeeId)
    if (emp) {
      employeeName = `${emp.firstName} ${emp.lastName}`
      departmentName = emp.departmentName
    }
    if (b.approvedBy) {
      const approver = emps.data.find(e => e.id === b.approvedBy)
      if (approver) reviewedBy = `${approver.firstName} ${approver.lastName}`
    }
  } catch { /* ignore */ }

  return {
    id: b.id,
    employeeId: b.employeeId,
    employeeName,
    departmentName,
    type: mapLeaveType(b.type),
    startDate: b.startDate,
    endDate: b.endDate,
    days: b.days ? parseFloat(b.days) : 1,
    reason: b.reason ?? '',
    status: b.status as LeaveStatus,
    reviewedBy,
    reviewedAt: b.updatedAt ? b.updatedAt.split('T')[0] : null,
    createdAt: b.createdAt ? b.createdAt.split('T')[0] : '',
  }
}

export interface GetLeaveRequestsParams {
  page?: number; limit?: number; employeeId?: string
  status?: LeaveStatus | ''; type?: LeaveType | ''
  startDate?: string; endDate?: string
}

export async function getLeaveRequests(params: GetLeaveRequestsParams = {}): Promise<PaginatedResponse<LeaveRequest>> {
  const { page = 1, limit = 50, employeeId = '', status = '', type = '' } = params
  const raw = await api.get<BackendLeaveRequest[]>('/leave')

  let filtered = raw
  if (employeeId) filtered = filtered.filter(r => r.employeeId === employeeId)
  if (status)     filtered = filtered.filter(r => r.status === status)
  if (type)       filtered = filtered.filter(r => mapLeaveType(r.type) === type)

  const mapped = await Promise.all(filtered.map(toLeaveRequest))
  const sorted = mapped.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const total = sorted.length
  const totalPages = Math.ceil(total / limit) || 1
  return { data: sorted.slice((page - 1) * limit, page * limit), total, page, limit, totalPages }
}

export async function getLeaveBalance(employeeId: string): Promise<LeaveBalance | null> {
  try {
    const b = await api.get<BackendLeaveBalance>(`/leave/balance/${employeeId}`)
    return {
      employeeId: b.employeeId,
      annual: b.earned ? parseFloat(b.earned) : 15,
      sick: b.sick ? parseFloat(b.sick) : 10,
      casual: b.casual ? parseFloat(b.casual) : 12,
      maternity: 0,
      paternity: 0,
      unpaid: 0,
    }
  } catch { return null }
}

export async function updateLeaveStatus(id: string, status: LeaveStatus): Promise<LeaveRequest> {
  const b = await api.put<BackendLeaveRequest>(`/leave/${id}`, { status })
  return toLeaveRequest(b)
}

export async function createLeaveRequest(
  data: Omit<LeaveRequest, 'id' | 'status' | 'reviewedBy' | 'reviewedAt' | 'createdAt' | 'employeeName' | 'departmentName'>
): Promise<LeaveRequest> {
  const typeMap: Record<string, string> = { annual: 'earned' }
  const b = await api.post<BackendLeaveRequest>('/leave', {
    type: typeMap[data.type] ?? data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    days: String(data.days),
    reason: data.reason,
  })
  return toLeaveRequest(b)
}

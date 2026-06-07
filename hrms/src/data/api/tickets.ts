import { api } from '../../lib/apiClient'
import type { SupportTicket, PaginatedResponse } from '../types'

export interface GetTicketsParams {
  page?: number; limit?: number; employeeId?: string; status?: string; category?: string; priority?: string; search?: string
}

// DB uses underscores ('in_progress', 'it_support'); frontend types use hyphens ('in-progress', 'it-support')
function normalizeTicket(raw: Record<string, unknown>): SupportTicket {
  return {
    ...raw,
    status:   String(raw.status   ?? '').replace(/_/g, '-'),
    category: String(raw.category ?? '').replace(/_/g, '-'),
  } as SupportTicket
}

function buildQuery(params: GetTicketsParams): string {
  const q = new URLSearchParams()
  if (params.page)       q.set('page',       String(params.page))
  if (params.limit)      q.set('limit',      String(params.limit))
  if (params.employeeId) q.set('employeeId', params.employeeId)
  if (params.search)     q.set('search',     params.search)
  if (params.status)     q.set('status',     params.status.replace(/-/g, '_'))
  if (params.category)   q.set('category',   params.category.replace(/-/g, '_'))
  return q.toString()
}

export async function getTickets(params: GetTicketsParams = {}): Promise<PaginatedResponse<SupportTicket>> {
  const paged = await api.get<PaginatedResponse<Record<string, unknown>>>(
    `/helpdesk?${buildQuery(params)}`,
  )
  return {
    ...paged,
    data: paged.data.map(normalizeTicket),
  }
}

export async function getTicket(id: string): Promise<SupportTicket | null> {
  try {
    const t = await api.get<Record<string, unknown>>(`/helpdesk/${id}`)
    return normalizeTicket(t)
  } catch {
    return null
  }
}

export async function createTicket(data: Partial<SupportTicket>): Promise<SupportTicket> {
  const body = {
    ...data,
    category: data.category?.replace(/-/g, '_'),
  }
  const t = await api.post<Record<string, unknown>>('/helpdesk', body)
  return normalizeTicket(t)
}

export async function updateTicket(id: string, data: Partial<SupportTicket>): Promise<SupportTicket> {
  const body: Record<string, unknown> = {}
  if (data.status)     body.status     = data.status.replace(/-/g, '_')
  if (data.assignedTo) body.assignedTo = data.assignedTo
  const t = await api.patch<Record<string, unknown>>(`/helpdesk/${id}`, body)
  return normalizeTicket(t)
}

// Saves a frontend-generated AI reply to the backend
export async function setAiReply(id: string, reply: string): Promise<SupportTicket> {
  const t = await api.patch<Record<string, unknown>>(`/helpdesk/${id}/reply`, { reply })
  return normalizeTicket(t)
}

export async function updateTicketStatus(id: string, status: string): Promise<SupportTicket> {
  return updateTicket(id, { status: status as SupportTicket['status'] })
}

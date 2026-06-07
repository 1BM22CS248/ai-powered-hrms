import { api } from '../../lib/apiClient'
import type { PerformanceReview, PaginatedResponse } from '../types'

export interface GetPerformanceParams {
  page?: number; limit?: number; employeeId?: string; reviewerId?: string; period?: string; pipFlag?: boolean
}

function buildQuery(params: GetPerformanceParams): string {
  const q = new URLSearchParams()
  if (params.page)       q.set('page',       String(params.page))
  if (params.limit)      q.set('limit',      String(params.limit))
  if (params.employeeId) q.set('employeeId', params.employeeId)
  if (params.reviewerId) q.set('reviewerId', params.reviewerId)
  if (params.period)     q.set('period',     params.period)
  return q.toString()
}

export async function getPerformanceReviews(params: GetPerformanceParams = {}): Promise<PaginatedResponse<PerformanceReview>> {
  return api.get<PaginatedResponse<PerformanceReview>>(`/performance?${buildQuery(params)}`)
}

export async function getReviewPeriods(): Promise<string[]> {
  return api.get<string[]>('/performance/periods')
}

export async function getEmployeeReviews(employeeId: string): Promise<PerformanceReview[]> {
  const result = await getPerformanceReviews({ employeeId, limit: 100 })
  return result.data
}

export async function createReview(data: Partial<PerformanceReview>): Promise<PerformanceReview> {
  return api.post<PerformanceReview>('/performance', data)
}

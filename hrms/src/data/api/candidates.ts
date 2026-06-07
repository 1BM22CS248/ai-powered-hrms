import { api } from '../../lib/apiClient'
import type { Candidate, JobPosting, PaginatedResponse } from '../types'

export interface GetCandidatesParams {
  page?: number; limit?: number; jobId?: string; status?: string; search?: string
}

function buildQuery(params: GetCandidatesParams): string {
  const q = new URLSearchParams()
  if (params.page)   q.set('page',   String(params.page))
  if (params.limit)  q.set('limit',  String(params.limit))
  if (params.jobId)  q.set('jobId',  params.jobId)
  if (params.status) q.set('status', params.status)
  if (params.search) q.set('search', params.search)
  return q.toString()
}

export async function getCandidates(params: GetCandidatesParams = {}): Promise<PaginatedResponse<Candidate>> {
  return api.get<PaginatedResponse<Candidate>>(`/recruitment/candidates?${buildQuery(params)}`)
}

export async function getCandidate(id: string): Promise<Candidate | null> {
  try {
    return await api.get<Candidate>(`/recruitment/candidates/${id}`)
  } catch {
    return null
  }
}

export async function getJobPostings(params: { status?: string } = {}): Promise<PaginatedResponse<JobPosting>> {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  return api.get<PaginatedResponse<JobPosting>>(`/recruitment/jobs?${q.toString()}`)
}

export async function updateCandidateStatus(id: string, status: string): Promise<Candidate> {
  return api.patch<Candidate>(`/recruitment/candidates/${id}/status`, { status })
}

export async function updateCandidateAiScore(
  id: string,
  score: number,
  strengths: string[],
  gaps: string[],
  recommendation: string,
): Promise<Candidate> {
  return api.patch<Candidate>(`/recruitment/candidates/${id}/ai-score`, {
    score, strengths, gaps, recommendation,
  })
}

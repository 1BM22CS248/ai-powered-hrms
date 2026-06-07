/**
 * Role: HR_ADMIN, MANAGER
 * Data: candidates (paginated), job postings
 * API: getCandidates, getJobPostings
 * AI: scoreResume seam — aiScore column
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { Briefcase } from 'lucide-react'
import { getCandidates, getJobPostings } from '../../../data/api/candidates'
import { Pagination } from '../../../components/table/Pagination'
import { TableSkeleton } from '../../../components/table/TableSkeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { formatDate } from '../../../lib/format'
import { CANDIDATE_STATUSES } from '../../../lib/constants'
import type { CandidateStatus } from '../../../data/types'

const STATUS_VARIANT: Record<CandidateStatus, 'secondary' | 'info' | 'warning' | 'success' | 'destructive'> = {
  applied: 'secondary', screening: 'info', interview: 'warning', offer: 'info', hired: 'success', rejected: 'destructive',
}

export default function CandidateListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [jobId, setJobId] = useState('')
  const [status, setStatus] = useState<CandidateStatus | ''>('')
  const [search, setSearch] = useState('')

  const { data: jobs } = useQuery({ queryKey: ['jobs'], queryFn: () => getJobPostings({ status: 'open' }) })

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', { page, jobId, status, search }],
    queryFn: () => getCandidates({ page, limit: 50, jobId, status, search }),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recruitment</h1>
        <p className="text-sm text-muted-foreground">{data ? `${data.total} candidates` : ''}</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search candidates…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="flex-1 min-w-[180px]" />
        <Select value={jobId || 'all'} onValueChange={v => { setJobId(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs?.data.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status || 'all'} onValueChange={v => { setStatus(v === 'all' ? '' : v as CandidateStatus); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(CANDIDATE_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={Briefcase} title="No candidates found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Candidate</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Job</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Applied</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">AI Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/recruitment/${c.id}`)}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.jobTitle}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(c.appliedAt)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[c.status]}>{CANDIDATE_STATUSES[c.status]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {/* AI: scoreResume result */}
                        {c.aiScore !== null ? (
                          <span className={`font-semibold ${c.aiScore >= 70 ? 'text-green-600' : c.aiScore >= 50 ? 'text-yellow-600' : 'text-destructive'}`}>
                            {c.aiScore}/100
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not scored</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

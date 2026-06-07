/**
 * Role: all roles (HR_ADMIN/MANAGER see all; EMPLOYEE sees own)
 * Data: performance reviews (paginated)
 * API: getPerformanceReviews, getReviewPeriods
 * AI: pipFlag badge (seam: // AI: pipRisk via computePipRisk)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { BarChart2 } from 'lucide-react'
import { getPerformanceReviews, getReviewPeriods } from '../../../data/api/performance'
import { useAuthStore } from '../../../store/authStore'
import { Pagination } from '../../../components/table/Pagination'
import { TableSkeleton } from '../../../components/table/TableSkeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { StarRating } from '../../../components/StarRating'
import { formatDate } from '../../../lib/format'

export default function PerformanceReviewsPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)!
  const [page, setPage] = useState(1)
  const [period, setPeriod] = useState('')

  const isEmployee = user.role === 'EMPLOYEE'

  const { data: periods } = useQuery({
    queryKey: ['performance', 'periods'],
    queryFn: getReviewPeriods,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['performance', 'reviews', { page, period, employeeId: isEmployee ? user.employeeId : '' }],
    queryFn: () => getPerformanceReviews({
      page,
      limit: 50,
      period: period || undefined,
      employeeId: isEmployee ? user.employeeId : undefined,
    }),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Performance Reviews</h1>
        <Select value={period || 'all'} onValueChange={v => { setPeriod(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            {periods?.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={BarChart2} title="No reviews found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Period</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reviewer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rating</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/performance/${r.id}`)}>
                      <td className="px-4 py-3 font-medium">{r.employeeName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.period}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.reviewerName}</td>
                      <td className="px-4 py-3"><StarRating value={r.overallRating} readOnly size="sm" /></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        {r.pipFlag && <Badge variant="destructive">PIP</Badge>}
                        {/* AI: pipRisk from computePipRisk */}
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

/**
 * Role: HR_ADMIN, MANAGER
 * Data: all leave requests (paginated)
 * API: getLeaveRequests, updateLeaveStatus
 * AI: none
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ClipboardList } from 'lucide-react'
import { getLeaveRequests, updateLeaveStatus } from '../../../data/api/leave'
import { Pagination } from '../../../components/table/Pagination'
import { TableSkeleton } from '../../../components/table/TableSkeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { formatDate, formatDays } from '../../../lib/format'
import { LEAVE_STATUSES, LEAVE_TYPES } from '../../../lib/constants'
import type { LeaveStatus } from '../../../data/types'

const STATUS_VARIANT: Record<LeaveStatus, 'warning' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
  cancelled: 'secondary',
}

export default function LeaveRequestsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<LeaveStatus | ''>('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['leave', 'requests', { page, status }],
    queryFn: () => getLeaveRequests({ page, limit: 50, status }),
    placeholderData: keepPreviousData,
  })

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeaveStatus }) =>
      updateLeaveStatus(id, status),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['leave'] })
      toast.success(`Leave request ${status}.`)
    },
    onError: () => toast.error('Failed to update leave request.'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Leave Requests</h1>
        <Select value={status || 'all'} onValueChange={v => { setStatus(v === 'all' ? '' : v as LeaveStatus); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(LEAVE_STATUSES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No leave requests" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">From</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">To</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Days</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{r.departmentName}</p>
                      </td>
                      <td className="px-4 py-3">{LEAVE_TYPES[r.type]}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.startDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.endDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDays(r.days)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[r.status]}>{LEAVE_STATUSES[r.status]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200"
                              onClick={() => changeStatus({ id: r.id, status: 'approved' })}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30"
                              onClick={() => changeStatus({ id: r.id, status: 'rejected' })}>
                              Reject
                            </Button>
                          </div>
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

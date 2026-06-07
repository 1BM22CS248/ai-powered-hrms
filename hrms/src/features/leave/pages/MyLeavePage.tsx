/**
 * Role: EMPLOYEE
 * Data: own leave requests, leave balance
 * API: getLeaveRequests (filtered by employeeId), getLeaveBalance
 * AI: none
 */
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/authStore'
import { getLeaveRequests, getLeaveBalance } from '../../../data/api/leave'
import { Card, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { formatDate, formatDays } from '../../../lib/format'
import { LEAVE_TYPES, LEAVE_STATUSES } from '../../../lib/constants'
import { ClipboardList } from 'lucide-react'
import type { LeaveStatus } from '../../../data/types'

const STATUS_VARIANT: Record<LeaveStatus, 'warning' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'warning', approved: 'success', rejected: 'destructive', cancelled: 'secondary',
}

export default function MyLeavePage() {
  const user = useAuthStore(s => s.user)!

  const { data: balance, isLoading: balLoading } = useQuery({
    queryKey: ['leave', 'balance', user.employeeId],
    queryFn: () => getLeaveBalance(user.employeeId),
  })

  const { data: requests, isLoading: reqLoading } = useQuery({
    queryKey: ['leave', 'my', user.employeeId],
    queryFn: () => getLeaveRequests({ employeeId: user.employeeId, limit: 20 }),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Leave</h1>

      {/* Balance */}
      <div>
        <h2 className="text-sm font-medium mb-3">Leave Balance</h2>
        {balLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : balance ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(LEAVE_TYPES).map(([k, label]) => (
              <Card key={k}><CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                <p className="text-2xl font-bold mt-1">{balance[k as keyof typeof balance]}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </CardContent></Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No leave balance on record.</p>
        )}
      </div>

      {/* Requests */}
      <div>
        <h2 className="text-sm font-medium mb-3">My Requests</h2>
        {reqLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !requests || requests.data.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No leave requests" description="You haven't applied for leave yet." />
        ) : (
          <div className="rounded-md border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">From</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">To</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Days</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.data.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{LEAVE_TYPES[r.type]}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.startDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.endDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDays(r.days)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[r.status]}>{LEAVE_STATUSES[r.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

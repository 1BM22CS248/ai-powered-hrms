/**
 * Role: HR_ADMIN, MANAGER
 * Data: attendance records (paginated, filtered)
 * API: getAttendance
 * AI: none
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { getAttendance } from '../../../data/api/attendance'
import { getEmployees } from '../../../data/api/employees'
import { Pagination } from '../../../components/table/Pagination'
import { TableSkeleton } from '../../../components/table/TableSkeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Calendar } from 'lucide-react'
import type { AttendanceStatus } from '../../../data/types'

const STATUS_VARIANT: Record<AttendanceStatus, 'success' | 'destructive' | 'warning' | 'secondary' | 'info'> = {
  present: 'success',
  absent: 'destructive',
  late: 'warning',
  'half-day': 'info',
  holiday: 'secondary',
  weekend: 'secondary',
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function monthStartStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function AttendanceListPage() {
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState(monthStartStr)
  const [endDate, setEndDate] = useState(todayStr)

  const { data: empData } = useQuery({
    queryKey: ['employees', { limit: 200 }],
    queryFn: () => getEmployees({ limit: 200 }),
    staleTime: 60_000,
  })
  const empMap = new Map((empData?.data ?? []).map(e => [e.id, `${e.firstName} ${e.lastName}`]))

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', { page, startDate, endDate }],
    queryFn: () => getAttendance({ page, limit: 50, startDate, endDate }),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Attendance</h1>

      <div className="flex gap-3 flex-wrap">
        <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }} className="w-40" />
        <Input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }} className="w-40" />
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={10} cols={5} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={Calendar} title="No attendance records" description="Adjust your date range." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Check In</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Check Out</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm">{empMap.get(r.employeeId) ?? r.employeeId}</td>
                      <td className="px-4 py-3">{r.date}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.checkIn ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.checkOut ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
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

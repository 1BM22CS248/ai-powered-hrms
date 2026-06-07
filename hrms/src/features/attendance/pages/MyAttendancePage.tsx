/**
 * Role: EMPLOYEE (own attendance)
 * Data: attendance records for current user
 * API: getEmployeeAttendance, getAttendanceSummary
 * AI: none
 */
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/authStore'
import { getEmployeeAttendance, getAttendanceSummary } from '../../../data/api/attendance'
import { Card, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { formatPercent } from '../../../lib/format'
import type { AttendanceStatus } from '../../../data/types'

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  late: 'bg-yellow-500',
  'half-day': 'bg-blue-400',
  holiday: 'bg-purple-400',
  weekend: 'bg-muted',
}

export default function MyAttendancePage() {
  const user = useAuthStore(s => s.user)!

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance', 'summary', user.employeeId],
    queryFn: () => getAttendanceSummary(user.employeeId, 90),
  })

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['attendance', 'employee', user.employeeId],
    queryFn: () => getEmployeeAttendance(user.employeeId),
  })

  const recentRecords = records?.slice(0, 30)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Attendance</h1>

      {/* Summary cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {[
            { label: 'Attendance Rate', value: formatPercent(summary.attendanceRate, 0) },
            { label: 'Present', value: summary.presentDays },
            { label: 'Absent', value: summary.absentDays },
            { label: 'Late', value: summary.lateDays },
            { label: 'Half Days', value: summary.halfDays },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* Recent records as mini calendar dots */}
      <div>
        <h2 className="text-sm font-medium mb-3">Last 30 days</h2>
        {recordsLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentRecords?.map(r => (
              <div key={r.id} className="flex flex-col items-center gap-1">
                <div className={`h-6 w-6 rounded-full ${STATUS_COLORS[r.status]}`} title={`${r.date}: ${r.status}`} />
                <span className="text-[9px] text-muted-foreground">{r.date.slice(8)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-3 mt-3">
          {(Object.entries(STATUS_COLORS) as [AttendanceStatus, string][]).map(([s, color]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`h-3 w-3 rounded-full ${color}`} />
              <span className="text-xs text-muted-foreground capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent table */}
      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Check In</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Check Out</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hours</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords?.filter(r => r.status !== 'weekend').slice(0, 20).map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{r.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.checkIn ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.checkOut ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.hoursWorked > 0 ? `${r.hoursWorked}h` : '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === 'present' ? 'success' : r.status === 'absent' ? 'destructive' : 'warning'}>
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/**
 * Role: all roles
 * Data: employee, attendance summary, leave balance, payroll records, performance reviews
 * API: getEmployee, getAttendanceSummary, getLeaveBalance, getPayrollRecords, getEmployeeReviews
 * AI: pipRisk badge (seam: // AI: pipRisk)
 */
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, Download } from 'lucide-react'
import { generatePayslip } from '../../../lib/pdf'
import { useEmployee } from '../hooks/useEmployees'
import { useQuery } from '@tanstack/react-query'
import { getAttendanceSummary } from '../../../data/api/attendance'
import { getLeaveBalance } from '../../../data/api/leave'
import { getPayrollRecords } from '../../../data/api/payroll'
import { getEmployeeReviews } from '../../../data/api/performance'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Skeleton } from '../../../components/ui/skeleton'
import { StarRating } from '../../../components/StarRating'
import { formatDate, formatINR, formatPercent } from '../../../lib/format'
import { EMPLOYEE_STATUSES, LEAVE_TYPES, PAYROLL_STATUSES } from '../../../lib/constants'
import type { EmployeeStatus, LeaveType } from '../../../data/types'

const STATUS_VARIANT: Record<EmployeeStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  active: 'success',
  'on-leave': 'warning',
  inactive: 'secondary',
  terminated: 'destructive',
}

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: emp, isLoading } = useEmployee(id)

  const { data: attSummary } = useQuery({
    queryKey: ['attendance', 'summary', id],
    queryFn: () => getAttendanceSummary(id!, 90),
    enabled: !!id,
  })

  const { data: leaveBalance } = useQuery({
    queryKey: ['leave', 'balance', id],
    queryFn: () => getLeaveBalance(id!),
    enabled: !!id,
  })

  const { data: payroll } = useQuery({
    queryKey: ['payroll', { employeeId: id }],
    queryFn: () => getPayrollRecords({ employeeId: id, limit: 6 }),
    enabled: !!id,
  })

  const { data: reviews } = useQuery({
    queryKey: ['performance', 'employee', id],
    queryFn: () => getEmployeeReviews(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!emp) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Employee not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/employees')}>Back to list</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Employees
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={emp.avatarUrl} />
              <AvatarFallback className="text-2xl">{emp.firstName[0]}{emp.lastName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-2xl font-bold">{emp.firstName} {emp.lastName}</h1>
                  <p className="text-muted-foreground">{emp.designation} · {emp.employeeCode}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={STATUS_VARIANT[emp.status]}>{EMPLOYEE_STATUSES[emp.status]}</Badge>
                  {/* AI: pipRisk badge */}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />{emp.email}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />{emp.phone}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />{emp.departmentName}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />Joined {formatDate(emp.joinDate)}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />{emp.city}, {emp.state}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Monthly Salary</p>
              <p className="text-xl font-bold mt-1">{formatINR(emp.salaryMonthly)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Manager</p>
              <p className="text-base font-medium mt-1">{emp.managerName ?? '—'}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="text-base font-medium mt-1 capitalize">{emp.gender}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-base font-medium mt-1">{emp.role.replace('_', ' ')}</p>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          {attSummary ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Attendance Rate', value: formatPercent(attSummary.attendanceRate, 0) },
                { label: 'Present Days', value: attSummary.presentDays },
                { label: 'Absent Days', value: attSummary.absentDays },
                { label: 'Late Days', value: attSummary.lateDays },
                { label: 'Half Days', value: attSummary.halfDays },
              ].map(s => (
                <Card key={s.label}><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold mt-1">{s.value}</p>
                </CardContent></Card>
              ))}
            </div>
          ) : <Skeleton className="h-32 w-full" />}
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          {leaveBalance === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : leaveBalance === null ? (
            <p className="text-sm text-muted-foreground">No leave balance on record.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(LEAVE_TYPES).map(([k, label]) => (
                <Card key={k}><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold mt-1">{leaveBalance[k as LeaveType]} days</p>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Month</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Gross</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Deductions</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Net Pay</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Payslip</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll?.data.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{r.month}</td>
                      <td className="px-4 py-3 text-right">{formatINR(r.grossSalary)}</td>
                      <td className="px-4 py-3 text-right text-destructive">{formatINR(r.totalDeductions)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatINR(r.netPay)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={r.status === 'paid' ? 'success' : r.status === 'processed' ? 'info' : 'secondary'}>
                          {PAYROLL_STATUSES[r.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={r.status === 'draft'}
                          onClick={() => {
                            const blob = generatePayslip(r)
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `payslip-${r.month}.pdf`
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                          title={r.status === 'draft' ? 'Not available yet' : 'Download PDF payslip'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4 space-y-3">
          {reviews?.map(r => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{r.period}</CardTitle>
                  <StarRating value={r.overallRating} readOnly size="sm" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{r.comments}</p>
                {r.pipFlag && <Badge variant="destructive" className="mt-2">PIP Flag</Badge>}
              </CardContent>
            </Card>
          ))}
          {reviews?.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet.</p>}
        </TabsContent>
      </Tabs>
    </div>
  )
}

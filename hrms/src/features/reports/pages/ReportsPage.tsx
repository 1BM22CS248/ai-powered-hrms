/**
 * Role: HR_ADMIN, MANAGER
 * Data: real employees + payroll + leave from backend
 */
import { useQuery } from '@tanstack/react-query'
import { FileBarChart, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { exportToCSV } from '../../../lib/csv'
import { getEmployees } from '../../../data/api/employees'
import { getPayrollRecords } from '../../../data/api/payroll'
import { getLeaveRequests } from '../../../data/api/leave'
import { formatINR } from '../../../lib/format'

export default function ReportsPage() {
  const { data: empsRes } = useQuery({ queryKey: ['employees', { limit: 200 }], queryFn: () => getEmployees({ limit: 200 }) })
  const { data: payrollRes } = useQuery({ queryKey: ['payroll', {}], queryFn: () => getPayrollRecords({ limit: 500 }) })
  const { data: leaveRes } = useQuery({ queryKey: ['leave', {}], queryFn: () => getLeaveRequests({ limit: 500 }) })

  const employees = empsRes?.data ?? []
  const active = employees.filter(e => e.status === 'active')
  const totalSalaryBill = active.reduce((s, e) => s + e.salaryMonthly, 0)
  const deptCount = new Set(employees.map(e => e.departmentName).filter(Boolean)).size

  const reports = [
    {
      title: 'Employee Directory',
      description: 'Full list of all employees with department and status.',
      export: () => exportToCSV(employees.map(e => ({
        Code: e.employeeCode, Name: `${e.firstName} ${e.lastName}`, Email: e.email,
        Department: e.departmentName, Designation: e.designation, Status: e.status, JoinDate: e.joinDate,
      })), 'employee-directory'),
    },
    {
      title: 'Payroll Summary',
      description: 'Net pay, gross, and deductions for all processed payroll records.',
      export: () => {
        const rows = (payrollRes?.data ?? []).filter(r => r.status === 'paid')
        exportToCSV(rows.map(r => ({ Employee: r.employeeName, Month: r.month, Gross: r.grossSalary, Deductions: r.totalDeductions, 'Net Pay': r.netPay })), 'payroll-summary')
      },
    },
    {
      title: 'Leave Utilisation',
      description: 'All approved leave requests with type, days, and status.',
      export: () => {
        const rows = (leaveRes?.data ?? []).filter(r => r.status === 'approved')
        exportToCSV(rows.map(r => ({ Employee: r.employeeName, Department: r.departmentName, Type: r.type, From: r.startDate, To: r.endDate, Days: r.days })), 'leave-utilisation')
      },
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: empsRes ? employees.length : null },
          { label: 'Active', value: empsRes ? active.length : null },
          { label: 'Monthly Salary Bill', value: empsRes ? formatINR(totalSalaryBill) : null },
          { label: 'Departments', value: empsRes ? deptCount : null },
        ].map(({ label, value }) => (
          <Card key={label}><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            {value !== null ? <p className="text-xl font-bold mt-1">{value}</p> : <Skeleton className="h-7 w-20 mt-1" />}
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(r => (
          <Card key={r.title}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileBarChart className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">{r.title}</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={r.export}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{r.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

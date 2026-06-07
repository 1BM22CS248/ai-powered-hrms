/**
 * Role: HR_ADMIN
 * Data: payroll records (paginated, by month)
 * API: getPayrollRecords, runPayroll, getDeptPayrollMedians
 * AI: payrollAnomaly seam — anomalyFlag column on each record
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Play, Download, AlertTriangle, Wallet } from 'lucide-react'
import { getPayrollRecords, runPayroll } from '../../../data/api/payroll'
import { Pagination } from '../../../components/table/Pagination'
import { TableSkeleton } from '../../../components/table/TableSkeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { formatINR, formatDate } from '../../../lib/format'
import { PAYROLL_STATUSES } from '../../../lib/constants'
import { exportToCSV } from '../../../lib/csv'
import type { PayrollStatus } from '../../../data/types'

const STATUS_VARIANT: Record<PayrollStatus, 'secondary' | 'info' | 'success'> = {
  draft: 'secondary', processed: 'info', paid: 'success',
}

export default function PayrollListPage() {
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', { page, month }],
    queryFn: () => getPayrollRecords({ page, limit: 50, month }),
    placeholderData: keepPreviousData,
  })

  const { mutate: doRunPayroll, isPending } = useMutation({
    mutationFn: () => runPayroll(month),
    onSuccess: ({ processed }) => {
      qc.invalidateQueries({ queryKey: ['payroll'] })
      toast.success(`Processed ${processed} payroll records for ${month}.`)
    },
    onError: () => toast.error('Failed to run payroll.'),
  })

  function handleExport() {
    if (!data) return
    exportToCSV(
      data.data.map(r => ({
        Employee: r.employeeName,
        Department: r.departmentName,
        Month: r.month,
        Gross: r.grossSalary,
        Deductions: r.totalDeductions,
        'Net Pay': r.netPay,
        Status: r.status,
      })),
      `payroll-${month}.csv`
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <div className="flex items-center flex-wrap gap-2">
          <Input type="month" value={month} onChange={e => { setMonth(e.target.value); setPage(1) }} className="w-32 sm:w-40" />
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => doRunPayroll()} disabled={isPending}>
            <Play className="h-4 w-4 mr-1" /> Run Payroll
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={10} cols={7} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={Wallet} title="No payroll records" description="Run payroll or select a different month." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Gross</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Deductions</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net Pay</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      {/* AI: anomaly column */}
                      Anomaly
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.paidAt ?? '')}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.departmentName}</td>
                      <td className="px-4 py-3 text-right">{formatINR(r.grossSalary)}</td>
                      <td className="px-4 py-3 text-right text-destructive">{formatINR(r.totalDeductions)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatINR(r.netPay)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[r.status]}>{PAYROLL_STATUSES[r.status]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {/* AI: payrollAnomaly flag */}
                        {r.anomalyFlag && (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> {r.anomalyReason}
                          </span>
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

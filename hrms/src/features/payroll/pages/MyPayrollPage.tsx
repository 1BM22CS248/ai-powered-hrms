/**
 * Role: EMPLOYEE
 * Data: own payroll records
 * API: getPayrollRecords (filtered by employeeId)
 */
import { useQuery } from '@tanstack/react-query'
import { Download, DollarSign } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { getPayrollRecords } from '../../../data/api/payroll'
import { generatePayslip } from '../../../lib/pdf'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { TableSkeleton } from '../../../components/table/TableSkeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { formatINR } from '../../../lib/format'
import { PAYROLL_STATUSES } from '../../../lib/constants'
import type { PayrollRecord, PayrollStatus } from '../../../data/types'

const STATUS_VARIANT: Record<PayrollStatus, 'secondary' | 'info' | 'success'> = {
  draft: 'secondary', processed: 'info', paid: 'success',
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function MyPayrollPage() {
  const user = useAuthStore(s => s.user)!

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', 'my', user.employeeId],
    queryFn: () => getPayrollRecords({ employeeId: user.employeeId, limit: 24 }),
  })

  function handleDownload(record: PayrollRecord) {
    const blob = generatePayslip(record)
    downloadBlob(blob, `payslip-${record.month}.pdf`)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Payslips</h1>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={DollarSign} title="No payroll records" description="No payslips available yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Month</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Gross</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Deductions</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net Pay</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Payslip</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(r => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{r.month}</td>
                    <td className="px-4 py-3 text-right">{formatINR(r.grossSalary)}</td>
                    <td className="px-4 py-3 text-right text-destructive">{formatINR(r.totalDeductions)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatINR(r.netPay)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[r.status]}>{PAYROLL_STATUSES[r.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(r)}
                        disabled={r.status === 'draft'}
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
        )}
      </div>
    </div>
  )
}

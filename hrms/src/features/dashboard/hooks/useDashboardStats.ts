import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/apiClient'
import { getEmployees } from '../../../data/api/employees'
import { getLeaveRequests } from '../../../data/api/leave'

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  onLeave: number
  openTickets: number
  pendingLeaves: number
  avgAttendanceRate: number
  headcountByDept: { name: string; value: number }[]
  monthlySalaryBill: number
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const [empsRes, leavesRes, headcountRows] = await Promise.all([
    getEmployees({ limit: 200 }),
    getLeaveRequests({ limit: 500 }),
    api.get<{ department: string | null; count: number }[]>('/reports/headcount').catch(() => [] as { department: string | null; count: number }[]),
  ])

  const employees = empsRes.data
  const active    = employees.filter(e => e.status === 'active')
  const pending   = leavesRes.data.filter(l => l.status === 'pending')

  const headcountByDept = headcountRows
    .filter(r => r.department)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(r => ({ name: r.department!, value: Number(r.count) }))

  const monthlySalaryBill = active.reduce((s, e) => s + e.salaryMonthly, 0)

  return {
    totalEmployees: empsRes.total,
    activeEmployees: active.length,
    onLeave: 0,
    openTickets: 0,
    pendingLeaves: pending.length,
    avgAttendanceRate: 0,
    headcountByDept,
    monthlySalaryBill,
  }
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
  })
}

/**
 * Role: all roles
 * Data: aggregate stats from all entities
 * API: getSeedData (via useDashboardStats)
 * AI: none (attritionRisk heatmap is a future seam)
 */
import { Users, UserCheck, CalendarOff, Headphones, ClipboardList, TrendingUp } from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { PieChart } from '../../../components/charts/PieChart'
import { formatINR, formatPercent } from '../../../lib/format'

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats()

  if (error) {
    return <p className="text-destructive">Failed to load dashboard data.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of your organisation</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : data ? (
          <>
            <StatCard label="Total Employees" value={data.totalEmployees.toLocaleString()} icon={Users} />
            <StatCard label="Active" value={data.activeEmployees.toLocaleString()} icon={UserCheck} sub={`${Math.round((data.activeEmployees / data.totalEmployees) * 100)}% of total`} />
            <StatCard label="On Leave" value={data.onLeave} icon={CalendarOff} />
            <StatCard label="Open Tickets" value={data.openTickets} icon={Headphones} />
            <StatCard label="Pending Leaves" value={data.pendingLeaves} icon={ClipboardList} />
            <StatCard label="Attendance Rate" value={formatPercent(data.avgAttendanceRate, 0)} icon={TrendingUp} sub="Last 30 days" />
          </>
        ) : null}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Headcount by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-64 w-full" /> : data ? (
              <PieChart data={data.headcountByDept} innerRadius={40} height={260} />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Salary Bill</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[260px]">
            {isLoading ? <Skeleton className="h-32 w-48" /> : data ? (
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{formatINR(data.monthlySalaryBill)}</p>
                <p className="text-muted-foreground text-sm mt-2">Total monthly payroll for active employees</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Role: all roles
 * Data: departments + employees
 * API: getSeedData
 * AI: none
 */
import { useQuery } from '@tanstack/react-query'
import { getEmployees } from '../../../data/api/employees'
import { Skeleton } from '../../../components/ui/skeleton'

async function fetchOrgData() {
  const res = await getEmployees({ limit: 200 })
  const deptMap = new Map<string, { id: string; name: string; head: typeof res.data[number] | undefined; employeeCount: number }>()
  for (const e of res.data) {
    if (!e.departmentName) continue
    if (!deptMap.has(e.departmentName)) {
      deptMap.set(e.departmentName, { id: e.departmentName, name: e.departmentName, head: undefined, employeeCount: 0 })
    }
    const dept = deptMap.get(e.departmentName)!
    dept.employeeCount++
    if (e.role === 'MANAGER' || e.role === 'HR_ADMIN') dept.head = e
  }
  return [...deptMap.values()]
}

export default function OrgChartPage() {
  const { data, isLoading } = useQuery({ queryKey: ['org-chart'], queryFn: fetchOrgData })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Org Chart</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.map(dept => (
            <div key={dept.id} className="rounded-lg border bg-card p-4 text-sm">
              <p className="font-semibold truncate">{dept.name}</p>
              {dept.head && (
                <p className="text-muted-foreground text-xs mt-1 truncate">
                  Head: {dept.head.firstName} {dept.head.lastName}
                </p>
              )}
              <p className="text-muted-foreground text-xs mt-0.5">{dept.employeeCount} members</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

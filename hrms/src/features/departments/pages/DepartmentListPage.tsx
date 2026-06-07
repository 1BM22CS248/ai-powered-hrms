/**
 * Role: HR_ADMIN, MANAGER
 * Data: departments
 * API: getSeedData().departments
 * AI: none
 */
import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { getEmployees } from '../../../data/api/employees'
import { TableSkeleton } from '../../../components/table/TableSkeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'

async function fetchDepartments() {
  const res = await getEmployees({ limit: 200 })
  const map = new Map<string, { id: string; name: string; headId: null; parentId: null; employeeCount: number; createdAt: string }>()
  for (const e of res.data) {
    if (!e.departmentName) continue
    const existing = map.get(e.departmentName)
    if (existing) { existing.employeeCount++ }
    else map.set(e.departmentName, { id: e.departmentName, name: e.departmentName, headId: null, parentId: null, employeeCount: 1, createdAt: '' })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export default function DepartmentListPage() {
  const { data, isLoading } = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Departments</h1>
      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : !data || data.length === 0 ? (
          <EmptyState icon={Building2} title="No departments found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employees</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.map(dept => (
                  <tr key={dept.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{dept.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dept.employeeCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dept.createdAt}</td>
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

/**
 * Role: all roles (HR_ADMIN sees all; MANAGER sees dept; EMPLOYEE sees limited)
 * Data: employees (paginated, filtered)
 * API: getEmployees
 * AI: attritionRisk badge on each row (seam: // AI: risk column)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useEmployees } from '../hooks/useEmployees'
import { EmployeeFilters } from '../components/EmployeeFilters'
import { AddEmployeeDialog } from '../components/AddEmployeeDialog'
import { Pagination } from '../../../components/table/Pagination'
import { TableSkeleton } from '../../../components/table/TableSkeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar'
import { useDebounce } from '../../../hooks/useDebounce'
import { formatDate } from '../../../lib/format'
import { EMPLOYEE_STATUSES } from '../../../lib/constants'
import type { EmployeeStatus, Role } from '../../../data/types'

const STATUS_VARIANT: Record<EmployeeStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  active: 'success',
  'on-leave': 'warning',
  inactive: 'secondary',
  terminated: 'destructive',
}

export default function EmployeeListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [status, setStatus] = useState<EmployeeStatus | ''>('')
  const [role, setRole] = useState<Role | ''>('')
  const [addOpen, setAddOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useEmployees({ page, limit: 50, search: debouncedSearch, departmentId, status, role })

  function handleSearchChange(v: string) {
    setSearch(v)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total.toLocaleString()} total` : 'Loading…'}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Add Employee
        </Button>
      </div>

      <EmployeeFilters
        search={search}
        departmentId={departmentId}
        status={status}
        role={role}
        onSearch={handleSearchChange}
        onDept={v => { setDepartmentId(v); setPage(1) }}
        onStatus={v => { setStatus(v); setPage(1) }}
        onRole={v => { setRole(v); setPage(1) }}
      />

      {/* Table */}
      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Designation</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Join Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    {/* AI: attritionRisk column */}
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(emp => (
                    <tr
                      key={emp.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/employees/${emp.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{emp.employeeCode}</td>
                      <td className="px-4 py-3">{emp.departmentName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{emp.designation}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(emp.joinDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[emp.status]}>
                          {EMPLOYEE_STATUSES[emp.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              limit={data.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
      <AddEmployeeDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}

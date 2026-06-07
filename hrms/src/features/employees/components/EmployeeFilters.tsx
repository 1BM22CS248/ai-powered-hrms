import { Search } from 'lucide-react'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useDepartments } from '../hooks/useEmployees'
import { EMPLOYEE_STATUSES, ROLES } from '../../../lib/constants'
import type { EmployeeStatus, Role } from '../../../data/types'

interface EmployeeFiltersProps {
  search: string
  departmentId: string
  status: EmployeeStatus | ''
  role: Role | ''
  onSearch: (v: string) => void
  onDept: (v: string) => void
  onStatus: (v: EmployeeStatus | '') => void
  onRole: (v: Role | '') => void
}

export function EmployeeFilters({ search, departmentId, status, role, onSearch, onDept, onStatus, onRole }: EmployeeFiltersProps) {
  const { data: departments = [] } = useDepartments()

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, code…"
          className="pl-8"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      <Select value={departmentId || 'all'} onValueChange={v => onDept(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map(d => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status || 'all'} onValueChange={v => onStatus(v === 'all' ? '' : v as EmployeeStatus)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.entries(EMPLOYEE_STATUSES).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={role || 'all'} onValueChange={v => onRole(v === 'all' ? '' : v as Role)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          {Object.entries(ROLES).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

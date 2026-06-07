import { api } from '../../lib/apiClient'
import type { Employee, PaginatedResponse, EmployeeStatus, Role } from '../types'

export interface GetEmployeesParams {
  page?: number
  limit?: number
  search?: string
  departmentId?: string
  status?: EmployeeStatus | ''
  role?: Role | ''
}

// backend employee shape (only the fields we get)
interface BackendEmp {
  id: string; empCode: string; name: string; email: string; phone: string | null
  role: string; department: string | null; designation: string | null
  joiningDate: string | null; salary: string | null; managerId: string | null
  status: string; createdAt: string; updatedAt: string
}

function mapRole(r: string): Role {
  if (r === 'admin' || r === 'hr') return 'HR_ADMIN'
  if (r === 'manager') return 'MANAGER'
  return 'EMPLOYEE'
}

function mapStatus(s: string): EmployeeStatus {
  if (s === 'terminated') return 'terminated'
  if (s === 'inactive') return 'inactive'
  return 'active'
}

function toEmployee(b: BackendEmp): Employee {
  const [firstName, ...rest] = (b.name ?? '').split(' ')
  const lastName = rest.join(' ') || ''
  const dept = b.department ?? ''
  return {
    id: b.id,
    employeeCode: b.empCode,
    firstName,
    lastName,
    email: b.email,
    phone: b.phone ?? '',
    gender: 'other',
    dateOfBirth: '1990-01-01',
    joinDate: b.joiningDate ?? '',
    departmentId: dept,
    departmentName: dept,
    designation: b.designation ?? '',
    managerId: b.managerId,
    managerName: null,
    role: mapRole(b.role),
    status: mapStatus(b.status),
    salaryMonthly: b.salary ? Math.round(parseFloat(b.salary) / 12) : 0,
    avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(b.name ?? b.email)}`,
    address: '',
    city: '',
    state: '',
  }
}

// cache so all callers share one fetch
let _cache: Employee[] | null = null
let _cachePromise: Promise<Employee[]> | null = null

async function fetchAll(): Promise<Employee[]> {
  if (_cache) return _cache
  if (_cachePromise) return _cachePromise
  _cachePromise = api.get<BackendEmp[]>('/employees').then(list => {
    _cache = list.map(toEmployee)
    _cachePromise = null
    return _cache
  })
  return _cachePromise
}

export function invalidateEmployeeCache() {
  _cache = null
}

export async function getEmployees(params: GetEmployeesParams = {}): Promise<PaginatedResponse<Employee>> {
  const all = await fetchAll()
  const { page = 1, limit = 50, search = '', departmentId = '', status = '', role = '' } = params

  let filtered = all

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(e =>
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      (e.designation ?? '').toLowerCase().includes(q)
    )
  }
  if (departmentId) filtered = filtered.filter(e => e.departmentId === departmentId)
  if (status)       filtered = filtered.filter(e => e.status === status)
  if (role)         filtered = filtered.filter(e => e.role === role)

  const total = filtered.length
  const totalPages = Math.ceil(total / limit) || 1
  const data = filtered.slice((page - 1) * limit, page * limit)
  return { data, total, page, limit, totalPages }
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const all = await fetchAll()
  return all.find(e => e.id === id) ?? null
}

export async function getEmployeeByEmail(email: string): Promise<Employee | null> {
  const all = await fetchAll()
  return all.find(e => e.email === email.toLowerCase()) ?? null
}

export async function getDirectReports(managerId: string): Promise<Employee[]> {
  const all = await fetchAll()
  return all.filter(e => e.managerId === managerId)
}

export async function updateEmployee(id: string, patch: Partial<Employee>): Promise<Employee> {
  const body: Record<string, unknown> = {}
  if (patch.firstName !== undefined || patch.lastName !== undefined) {
    const all = _cache ?? []
    const existing = all.find(e => e.id === id)
    body.name = `${patch.firstName ?? existing?.firstName ?? ''} ${patch.lastName ?? existing?.lastName ?? ''}`.trim()
  }
  if (patch.email !== undefined)        body.email       = patch.email
  if (patch.phone !== undefined)        body.phone       = patch.phone
  if (patch.designation !== undefined)  body.designation = patch.designation
  if (patch.departmentName !== undefined) body.department = patch.departmentName
  if (patch.joinDate !== undefined)     body.joiningDate = patch.joinDate
  if (patch.managerId !== undefined)    body.managerId   = patch.managerId
  if (patch.salaryMonthly !== undefined) body.salary     = patch.salaryMonthly * 12
  if (patch.role !== undefined)
    body.role = patch.role === 'HR_ADMIN' ? 'hr' : patch.role.toLowerCase()
  if (patch.status !== undefined)       body.status      = patch.status
  const b = await api.put<BackendEmp>(`/employees/${id}`, body)
  invalidateEmployeeCache()
  return toEmployee(b)
}

export interface CreateEmployeeResult {
  employee: Employee
  temporaryPassword: string
}

export async function createEmployee(data: Omit<Employee, 'id' | 'employeeCode'>): Promise<CreateEmployeeResult> {
  const result = await api.post<{ employee: BackendEmp; temporaryPassword: string }>('/employees', {
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    phone: data.phone,
    role: data.role === 'HR_ADMIN' ? 'hr' : data.role.toLowerCase(),
    department: data.departmentName,
    designation: data.designation,
    joiningDate: data.joinDate,
    salary: data.salaryMonthly * 12,
    empCode: `EMP${Date.now()}`,
  })
  invalidateEmployeeCache()
  return { employee: toEmployee(result.employee), temporaryPassword: result.temporaryPassword }
}

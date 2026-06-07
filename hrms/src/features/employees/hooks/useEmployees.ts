import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getEmployees, getEmployee, updateEmployee, createEmployee, type GetEmployeesParams, type CreateEmployeeResult } from '../../../data/api/employees'
import type { Employee } from '../../../data/types'

export function useEmployees(params: GetEmployeesParams) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => getEmployees(params),
    placeholderData: keepPreviousData,
  })
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => getEmployee(id!),
    enabled: !!id,
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Employee> }) => updateEmployee(id, patch),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success(`${updated.firstName} ${updated.lastName} updated.`)
    },
    onError: () => toast.error('Failed to update employee.'),
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation<CreateEmployeeResult, Error, Omit<Employee, 'id' | 'employeeCode'>>({
    mutationFn: (data) => createEmployee(data),
    onSuccess: ({ employee, temporaryPassword }) => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      // Show temporary password in a persistent toast so HR can share it
      toast.success(
        `${employee.firstName} ${employee.lastName} added. Temporary password: ${temporaryPassword}`,
        { duration: 15000 }
      )
    },
    onError: () => toast.error('Failed to add employee.'),
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await getEmployees({ limit: 200 })
      const seen = new Map<string, { id: string; name: string }>()
      for (const e of res.data) {
        if (e.departmentName && !seen.has(e.departmentName)) {
          seen.set(e.departmentName, { id: e.departmentName, name: e.departmentName })
        }
      }
      return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
    },
    staleTime: 60_000,
  })
}

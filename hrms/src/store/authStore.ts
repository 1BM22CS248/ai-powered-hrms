import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSession, Role } from '../data/types'
import { api, setToken, clearToken } from '../lib/apiClient'

interface AuthState {
  user: UserSession | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  demoLogin: (role: 'admin' | 'manager' | 'employee') => Promise<boolean>
  logout: () => void
}

// backend role → frontend Role
function mapRole(r: string): Role {
  if (r === 'admin' || r === 'hr') return 'HR_ADMIN'
  if (r === 'manager') return 'MANAGER'
  return 'EMPLOYEE'
}

interface BackendEmployee {
  id: string; empCode: string; name: string; email: string
  role: string; department: string | null; designation: string | null
  joiningDate: string | null; salary: string | null; managerId: string | null
  status: string; phone: string | null; createdAt: string
}

function toSession(emp: BackendEmployee): UserSession {
  const [firstName, ...rest] = (emp.name ?? '').split(' ')
  const lastName = rest.join(' ') || ''
  const dept = emp.department ?? ''
  return {
    employeeId: emp.id,
    firstName,
    lastName,
    email: emp.email,
    role: mapRole(emp.role),
    departmentId: dept,
    departmentName: dept,
    avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(emp.name ?? emp.email)}`,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api.post<{ token: string; employee: BackendEmployee }>(
            '/auth/login',
            { email: email.toLowerCase(), password }
          )
          setToken(data.token)
          set({ user: toSession(data.employee), isLoading: false, error: null })
          return true
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Login failed.'
          set({ isLoading: false, error: msg })
          return false
        }
      },

      demoLogin: async (role) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api.post<{ token: string; employee: BackendEmployee }>(
            '/auth/demo-login',
            { role }
          )
          setToken(data.token)
          set({ user: toSession(data.employee), isLoading: false, error: null })
          return true
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Demo login failed.'
          set({ isLoading: false, error: msg })
          return false
        }
      },

      logout: () => {
        // Clear both localStorage token and httpOnly cookie
        clearToken()
        // Fire-and-forget — best effort to clear server-side cookie
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
        set({ user: null })
      },
    }),
    {
      name: 'hrms-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

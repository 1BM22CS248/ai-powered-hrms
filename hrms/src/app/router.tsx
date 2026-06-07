import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../data/types'

// Lazy-load pages for code splitting
import { lazy, Suspense } from 'react'

function lazyPage(importFn: () => Promise<{ default: React.ComponentType }>) {
  const Component = lazy(importFn)
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground p-8">Loading…</div>}>
      <Component />
    </Suspense>
  )
}

// ─── Guards ───────────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// ─── Shell Layout ─────────────────────────────────────────────────────────────

const Shell = lazy(() => import('../components/layout/Shell').then(m => ({ default: m.Shell })))

function ProtectedLayout() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <Shell />
      </Suspense>
    </RequireAuth>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Public
  {
    path: '/login',
    element: (
      <GuestOnly>
        {lazyPage(() => import('../features/auth/pages/LoginPage'))}
      </GuestOnly>
    ),
  },

  // Protected — wrapped in Shell
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // Dashboard
      { path: 'dashboard', element: lazyPage(() => import('../features/dashboard/pages/DashboardPage')) },

      // Employees
      { path: 'employees', element: lazyPage(() => import('../features/employees/pages/EmployeeListPage')) },
      { path: 'employees/:id', element: lazyPage(() => import('../features/employees/pages/EmployeeProfilePage')) },

      // Departments + Org chart
      {
        path: 'departments',
        element: (
          <RequireRole roles={['HR_ADMIN', 'MANAGER']}>
            {lazyPage(() => import('../features/departments/pages/DepartmentListPage'))}
          </RequireRole>
        ),
      },
      { path: 'org-chart', element: lazyPage(() => import('../features/orgchart/pages/OrgChartPage')) },

      // Attendance
      { path: 'attendance', element: lazyPage(() => import('../features/attendance/pages/AttendanceListPage')) },
      { path: 'my-attendance', element: lazyPage(() => import('../features/attendance/pages/MyAttendancePage')) },

      // Leave
      {
        path: 'leave',
        element: (
          <RequireRole roles={['HR_ADMIN', 'MANAGER']}>
            {lazyPage(() => import('../features/leave/pages/LeaveRequestsPage'))}
          </RequireRole>
        ),
      },
      { path: 'my-leave', element: lazyPage(() => import('../features/leave/pages/MyLeavePage')) },

      // Payroll
      {
        path: 'payroll',
        element: (
          <RequireRole roles={['HR_ADMIN']}>
            {lazyPage(() => import('../features/payroll/pages/PayrollListPage'))}
          </RequireRole>
        ),
      },
      { path: 'my-payroll', element: lazyPage(() => import('../features/payroll/pages/MyPayrollPage')) },

      // Performance
      { path: 'performance', element: lazyPage(() => import('../features/performance/pages/PerformanceReviewsPage')) },
      { path: 'performance/:id', element: lazyPage(() => import('../features/performance/pages/ReviewDetailPage')) },

      // Recruitment — AI resume screening
      {
        path: 'recruitment',
        element: (
          <RequireRole roles={['HR_ADMIN', 'MANAGER']}>
            {lazyPage(() => import('../features/recruitment/pages/CandidateListPage'))}
          </RequireRole>
        ),
      },
      {
        path: 'recruitment/:id',
        element: (
          <RequireRole roles={['HR_ADMIN', 'MANAGER']}>
            {lazyPage(() => import('../features/recruitment/pages/CandidateDetailPage'))}
          </RequireRole>
        ),
      },

      // Helpdesk — AI suggested replies
      { path: 'helpdesk', element: lazyPage(() => import('../features/helpdesk/pages/TicketListPage')) },
      { path: 'helpdesk/:id', element: lazyPage(() => import('../features/helpdesk/pages/TicketDetailPage')) },

      // Notifications
      { path: 'notifications', element: lazyPage(() => import('../features/notifications/pages/NotificationsPage')) },

      // Onboarding
      { path: 'onboarding', element: lazyPage(() => import('../features/onboarding/pages/OnboardingPage')) },

      // Reports
      {
        path: 'reports',
        element: (
          <RequireRole roles={['HR_ADMIN', 'MANAGER']}>
            {lazyPage(() => import('../features/reports/pages/ReportsPage'))}
          </RequireRole>
        ),
      },

      // Audit
      {
        path: 'audit',
        element: (
          <RequireRole roles={['HR_ADMIN']}>
            {lazyPage(() => import('../features/audit/pages/AuditLogPage'))}
          </RequireRole>
        ),
      },

      // Settings
      { path: 'settings', element: lazyPage(() => import('../features/settings/pages/SettingsPage')) },
    ],
  },

  // 404
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])

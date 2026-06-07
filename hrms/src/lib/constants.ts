import type { Role, EmployeeStatus, LeaveType, LeaveStatus, AttendanceStatus, TicketCategory, TicketStatus, TicketPriority, PayrollStatus, CandidateStatus } from '../data/types'

export const ROLES: Record<Role, string> = {
  HR_ADMIN: 'HR Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
}

export const EMPLOYEE_STATUSES: Record<EmployeeStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  'on-leave': 'On Leave',
  terminated: 'Terminated',
}

export const LEAVE_TYPES: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  unpaid: 'Unpaid Leave',
}

export const LEAVE_STATUSES: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export const ATTENDANCE_STATUSES: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  'half-day': 'Half Day',
  holiday: 'Holiday',
  weekend: 'Weekend',
}

export const TICKET_CATEGORIES: Record<TicketCategory, string> = {
  payroll: 'Payroll',
  leave: 'Leave',
  attendance: 'Attendance',
  policy: 'Policy',
  'it-support': 'IT Support',
  general: 'General',
}

export const TICKET_STATUSES: Record<TicketStatus, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const TICKET_PRIORITIES: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const PAYROLL_STATUSES: Record<PayrollStatus, string> = {
  draft: 'Draft',
  processed: 'Processed',
  paid: 'Paid',
}

export const CANDIDATE_STATUSES: Record<CandidateStatus, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
}

export const PERFORMANCE_RATINGS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
}

// Demo role labels used by the login page quick-access buttons.
// Credentials (passwords) are never stored in frontend code.
// The backend /api/auth/demo-login endpoint resolves these to real accounts
// and ONLY works when NODE_ENV !== 'production'.
export const DEMO_ROLES: { role: 'admin' | 'manager' | 'employee'; label: string }[] = [
  { role: 'admin',    label: 'HR Admin'  },
  { role: 'manager',  label: 'Manager'   },
  { role: 'employee', label: 'Employee'  },
]

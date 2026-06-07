// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type Role = 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE'

export type EmployeeStatus = 'active' | 'inactive' | 'on-leave' | 'terminated'

export type Gender = 'male' | 'female' | 'other'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'holiday' | 'weekend'

export type LeaveType = 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'unpaid'

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type PayrollStatus = 'draft' | 'processed' | 'paid'

export type PerformanceRating = 1 | 2 | 3 | 4 | 5

export type TicketCategory = 'payroll' | 'leave' | 'attendance' | 'policy' | 'it-support' | 'general'

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export type CandidateStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'

export type RiskLevel = 'low' | 'medium' | 'high'

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Department {
  id: string
  name: string
  headId: string | null
  parentId: string | null
  employeeCount: number
  createdAt: string
}

export interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: Gender
  dateOfBirth: string        // ISO
  joinDate: string           // ISO
  departmentId: string
  departmentName: string
  designation: string
  managerId: string | null
  managerName: string | null
  role: Role
  status: EmployeeStatus
  salaryMonthly: number      // INR, raw integer
  avatarUrl: string
  address: string
  city: string
  state: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string               // ISO YYYY-MM-DD
  checkIn: string | null     // HH:mm
  checkOut: string | null    // HH:mm
  hoursWorked: number        // decimal hours
  status: AttendanceStatus
}

export interface LeaveBalance {
  employeeId: string
  annual: number
  sick: number
  casual: number
  maternity: number
  paternity: number
  unpaid: number
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  departmentName: string
  type: LeaveType
  startDate: string          // ISO
  endDate: string            // ISO
  days: number
  reason: string
  status: LeaveStatus
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  departmentName: string
  month: string              // YYYY-MM
  basicSalary: number        // INR
  hra: number
  conveyance: number
  medicalAllowance: number
  bonus: number
  grossSalary: number
  pf: number
  tax: number
  otherDeductions: number
  totalDeductions: number
  netPay: number
  status: PayrollStatus
  paidAt: string | null
  anomalyFlag: boolean
  anomalyReason: string | null
}

export interface PerformanceReview {
  id: string
  employeeId: string
  employeeName: string
  reviewerId: string
  reviewerName: string
  period: string             // e.g. "Q1 2024"
  goals: number              // 1–5
  quality: number            // 1–5
  teamwork: number           // 1–5
  communication: number      // 1–5
  initiative: number         // 1–5
  overallRating: PerformanceRating
  comments: string
  pipFlag: boolean
  createdAt: string
}

export interface SupportTicket {
  id: string
  ticketNumber: string
  employeeId: string
  employeeName: string
  category: TicketCategory
  priority: TicketPriority
  subject: string
  description: string
  status: TicketStatus
  assignedTo: string | null
  aiSuggestedReply: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export interface JobPosting {
  id: string
  title: string
  departmentId: string
  departmentName: string
  location: string
  type: 'full-time' | 'part-time' | 'contract'
  experience: string
  description: string
  status: 'open' | 'closed' | 'on-hold'
  openings: number
  createdAt: string
}

export interface Candidate {
  id: string
  jobId: string
  jobTitle: string
  firstName: string
  lastName: string
  email: string
  phone: string
  resumeText: string
  resumeUrl: string | null
  aiScore: number | null        // 0–100
  aiStrengths: string[] | null
  aiGaps: string[] | null
  aiRecommendation: string | null
  status: CandidateStatus
  appliedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'leave' | 'payroll' | 'performance' | 'ticket' | 'system' | 'onboarding'
  title: string
  message: string
  read: boolean
  link: string | null
  createdAt: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  details: string
  ipAddress: string
  createdAt: string
}

export interface OnboardingTask {
  id: string
  employeeId: string
  title: string
  description: string
  completed: boolean
  dueDate: string
  completedAt: string | null
  category: 'documents' | 'setup' | 'training' | 'introduction'
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface UserSession {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  role: Role
  departmentId: string
  departmentName: string
  avatarUrl: string
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── AI Types ─────────────────────────────────────────────────────────────────

export interface ResumeScore {
  score: number
  strengths: string[]
  gaps: string[]
  recommendation: string
  error?: boolean
}

export interface PipRisk {
  risk: RiskLevel
  reasons: string[]
}

export interface AttritionRisk {
  risk: RiskLevel
  score: number               // 0–100
  factors: string[]
}

export interface AnomalyFlag {
  employeeId: string
  payrollId: string
  deviation: number           // percentage
  reason: string
}

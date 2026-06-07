import { callGemini, GeminiMessage } from '../gemini'
import { buildNavigationSystemPrompt } from '../prompts/navigation'
import { db } from '../../db/client'
import { employees, leaveRequests } from '../../db/schema'
import { eq, and, count } from 'drizzle-orm'

export interface ChatResult {
  reply: string
  navigateTo?: string
}

export async function handleChatMessage(
  employeeId: string,
  message: string,
  history: GeminiMessage[] = [],
): Promise<ChatResult> {
  const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId))
  if (!emp) throw new Error(`Employee ${employeeId} not found`)

  const [leavesTakenResult] = await db
    .select({ count: count() })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.employeeId, employeeId), eq(leaveRequests.status, 'approved')))

  const leavesTaken  = Number(leavesTakenResult?.count ?? 0)
  const leaveBalance = Math.max(0, 20 - leavesTaken)

  const systemPrompt = buildNavigationSystemPrompt({
    name: emp.name,
    role: emp.role,
    department: emp.department ?? 'N/A',
    leaveBalance,
  })

  const messages: GeminiMessage[] = [...history, { role: 'user', content: message }]
  const raw = await callGemini(systemPrompt, messages, 512)

  // M-2: whitelist allowed navigation targets to prevent prompt injection
  const ALLOWED_ROUTES = [
    '/dashboard', '/employees', '/employees/new',
    '/attendance', '/attendance/mark',
    '/leave', '/leave/apply',
    '/payroll', '/my-payroll',
    '/performance', '/recruitment',
    '/helpdesk', '/helpdesk/new',
    '/notifications', '/onboarding', '/reports', '/settings',
  ]

  const navMatch  = raw.match(/\[NAVIGATE:(.*?)\]/)
  const rawRoute  = navMatch ? navMatch[1].trim() : undefined
  const navigateTo = rawRoute && ALLOWED_ROUTES.includes(rawRoute) ? rawRoute : undefined
  const reply      = raw.replace(/\[NAVIGATE:.*?\]/, '').trim()

  return { reply, navigateTo }
}

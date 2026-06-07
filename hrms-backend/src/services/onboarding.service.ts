import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { onboardingTasks, employees } from '../db/schema'
import { AppError } from '../utils/errors'

type Category = 'documents' | 'setup' | 'training' | 'introduction'

const DEFAULT_TASKS: { title: string; description: string; category: Category; dayOffset: number }[] = [
  { title: 'Sign employment contract',    description: 'Review and sign your employment agreement with HR.',                                   category: 'documents',     dayOffset: 1 },
  { title: 'Submit identity proof',       description: 'Upload a valid government-issued ID (Aadhaar, Passport, or Driving Licence).',         category: 'documents',     dayOffset: 3 },
  { title: 'Submit address proof',        description: 'Upload a utility bill, bank statement, or rental agreement as address proof.',          category: 'documents',     dayOffset: 3 },
  { title: 'Set up work email',           description: 'Configure your official email account on all work devices.',                            category: 'setup',         dayOffset: 1 },
  { title: 'Complete HRMS profile',       description: 'Fill in all your personal and professional details on this portal.',                    category: 'setup',         dayOffset: 2 },
  { title: 'Meet your manager',           description: 'Schedule and attend a one-on-one introductory meeting with your reporting manager.',    category: 'introduction',  dayOffset: 2 },
  { title: 'Meet your team',             description: 'Attend a team introduction session and connect with your colleagues.',                   category: 'introduction',  dayOffset: 3 },
  { title: 'Complete HR orientation',     description: 'Watch the company orientation video and complete the accompanying quiz.',               category: 'training',      dayOffset: 7 },
  { title: 'Review company policies',     description: 'Read the employee handbook and acknowledge the code of conduct.',                       category: 'training',      dayOffset: 7 },
]

function addDays(base: string | null, days: number): string {
  const d = base ? new Date(base) : new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export async function getOnboardingTasks(employeeId: string) {
  let tasks = await db.select().from(onboardingTasks)
    .where(eq(onboardingTasks.employeeId, employeeId))
    .orderBy(onboardingTasks.createdAt)

  if (tasks.length === 0) {
    const [emp] = await db.select({ joiningDate: employees.joiningDate })
      .from(employees).where(eq(employees.id, employeeId)).limit(1)

    if (!emp) throw new AppError('Employee not found', 404)

    const toInsert = DEFAULT_TASKS.map(t => ({
      employeeId,
      title: t.title,
      description: t.description,
      category: t.category,
      dueDate: addDays(emp.joiningDate, t.dayOffset),
      completed: false,
    }))

    tasks = await db.insert(onboardingTasks).values(toInsert).returning()
    tasks.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0))
  }

  return tasks
}

export async function completeTask(taskId: string, employeeId: string) {
  const [task] = await db.select().from(onboardingTasks)
    .where(eq(onboardingTasks.id, taskId)).limit(1)

  if (!task) throw new AppError('Task not found', 404)
  if (task.employeeId !== employeeId) throw new AppError('Forbidden', 403)

  const [updated] = await db.update(onboardingTasks)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(onboardingTasks.id, taskId))
    .returning()

  return updated
}

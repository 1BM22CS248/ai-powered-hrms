/**
 * Role: all roles
 * EMPLOYEE   → own task list (auto-seeded on first visit)
 * HR_ADMIN / MANAGER → all employees' onboarding status, expandable rows
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCheck, Check, ChevronDown, ChevronRight, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../../store/authStore'
import { api } from '../../../lib/apiClient'
import { getEmployees } from '../../../data/api/employees'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Skeleton } from '../../../components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { cn } from '../../../lib/utils'
import { formatDate } from '../../../lib/format'
import type { OnboardingTask, Employee } from '../../../data/types'

// ─── API helpers ──────────────────────────────────────────────────────────────

interface BackendTask {
  id: string; employeeId: string; title: string; description: string
  category: string; completed: boolean; dueDate: string
  completedAt: string | null; createdAt: string | null
}

function toTask(b: BackendTask): OnboardingTask {
  return {
    id: b.id,
    employeeId: b.employeeId,
    title: b.title,
    description: b.description,
    category: b.category as OnboardingTask['category'],
    completed: b.completed,
    dueDate: b.dueDate,
    completedAt: b.completedAt,
  }
}

async function fetchAllTasks(): Promise<OnboardingTask[]> {
  const rows = await api.get<unknown>('/onboarding')
  return Array.isArray(rows) ? (rows as BackendTask[]).map(toTask) : []
}

async function fetchEmployeeTasks(employeeId: string): Promise<OnboardingTask[]> {
  const rows = await api.get<unknown>(`/onboarding/${employeeId}`)
  return Array.isArray(rows) ? (rows as BackendTask[]).map(toTask) : []
}

async function markComplete(taskId: string): Promise<OnboardingTask> {
  const b = await api.patch<BackendTask>(`/onboarding/${taskId}/complete`, {})
  return toTask(b)
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  documents:    'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
  setup:        'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
  training:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200',
  introduction: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200',
}

function TaskList({
  tasks, isPending, onComplete,
}: {
  tasks: OnboardingTask[]
  isPending: boolean
  onComplete: (id: string) => void
}) {
  return (
    <div className="space-y-1.5">
      {tasks.map(task => (
        <div
          key={task.id}
          className={cn(
            'rounded-md border p-3 flex items-start gap-3',
            task.completed ? 'bg-muted/30' : 'bg-card',
          )}
        >
          <button
            disabled={task.completed || isPending}
            onClick={() => onComplete(task.id)}
            className={cn(
              'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
              task.completed
                ? 'bg-primary border-primary cursor-default'
                : 'border-muted-foreground hover:border-primary cursor-pointer',
            )}
          >
            {task.completed && <Check className="h-3 w-3 text-primary-foreground" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn('text-sm font-medium', task.completed && 'line-through text-muted-foreground')}>
                {task.title}
              </p>
              <span className={cn('text-xs px-1.5 py-0.5 rounded', CATEGORY_COLORS[task.category])}>
                {task.category}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Due: {task.dueDate}</p>
          </div>

          {!task.completed && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-7 text-xs"
              disabled={isPending}
              onClick={() => onComplete(task.id)}
            >
              Mark done
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Employee self-view ───────────────────────────────────────────────────────

function EmployeeOnboarding({ employeeId }: { employeeId: string }) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding', employeeId],
    queryFn: () => fetchEmployeeTasks(employeeId),
  })

  const { mutate: complete, isPending } = useMutation({
    mutationFn: markComplete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding', employeeId] })
      toast.success('Task marked as complete.')
    },
    onError: () => toast.error('Failed to update task.'),
  })

  const tasks = data ?? []
  const completed = tasks.filter(t => t.completed).length
  const total = tasks.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">My Onboarding</h1>
        {total > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{completed}/{total} tasks completed</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : total === 0 ? (
        <EmptyState icon={UserCheck} title="No onboarding tasks" description="Your onboarding is complete or not yet assigned." />
      ) : (
        <TaskList tasks={tasks} isPending={isPending} onComplete={complete} />
      )}
    </div>
  )
}

// ─── Admin employee row ───────────────────────────────────────────────────────

function EmployeeRow({
  employee,
  seededTasks,
  globalPending,
  onComplete,
}: {
  employee: Employee
  seededTasks: OnboardingTask[]
  globalPending: boolean
  onComplete: (taskId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const qc = useQueryClient()

  // Fetch + auto-seed tasks for this employee when row is expanded without tasks
  const { data: fetchedTasks, isFetching, refetch } = useQuery({
    queryKey: ['onboarding', employee.id],
    queryFn: () => fetchEmployeeTasks(employee.id),
    enabled: false,
  })

  const rowTasks: OnboardingTask[] = fetchedTasks ?? seededTasks

  async function handleToggle() {
    if (!expanded && seededTasks.length === 0 && !fetchedTasks) {
      const result = await refetch()
      if (result.data) {
        // Invalidate the admin all-tasks query so the list refreshes next time
        qc.invalidateQueries({ queryKey: ['onboarding', 'all'] })
      }
    }
    setExpanded(prev => !prev)
  }

  const completed = rowTasks.filter(t => t.completed).length
  const total = rowTasks.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  function statusBadge() {
    if (isFetching) return <Badge variant="secondary">Loading…</Badge>
    if (total === 0) return <Badge variant="secondary">Not started</Badge>
    if (completed === total) return <Badge variant="success">Complete</Badge>
    return <Badge variant="warning">In progress</Badge>
  }

  return (
    <div className="border-b last:border-0">
      {/* Row header */}
      <button
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
        onClick={handleToggle}
        aria-expanded={expanded}
      >
        <span className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>

        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={employee.avatarUrl} />
          <AvatarFallback className="text-xs">
            {employee.firstName[0]}{employee.lastName[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{employee.firstName} {employee.lastName}</p>
          <p className="text-xs text-muted-foreground truncate">{employee.departmentName} · {employee.designation}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          Joined {formatDate(employee.joinDate)}
        </div>

        {total > 0 && (
          <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0 w-28">
            <span className="text-xs text-muted-foreground">{completed}/{total} tasks</span>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="shrink-0">{statusBadge()}</div>
      </button>

      {/* Expanded task list */}
      {expanded && (
        <div className="px-12 pb-4 pt-1">
          {isFetching ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : rowTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No tasks found for this employee.</p>
          ) : (
            <TaskList tasks={rowTasks} isPending={globalPending} onComplete={onComplete} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Admin / HR view (all employees) ─────────────────────────────────────────

function AdminOnboarding() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  // Fetch all employees
  const { data: employeesPage, isLoading: empsLoading } = useQuery({
    queryKey: ['employees', { limit: 200 }],
    queryFn: () => getEmployees({ limit: 200 }),
  })

  // Fetch all existing onboarding tasks (employees who've been seeded)
  const { data: allTasksRaw, isLoading: tasksLoading } = useQuery({
    queryKey: ['onboarding', 'all'],
    queryFn: fetchAllTasks,
  })

  const { mutate: complete, isPending } = useMutation({
    mutationFn: markComplete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding'] })
      toast.success('Task marked as complete.')
    },
    onError: () => toast.error('Failed to update task.'),
  })

  const isLoading = empsLoading || tasksLoading

  // Group tasks by employeeId — safe even if allTasksRaw is undefined
  const byEmp = new Map<string, OnboardingTask[]>()
  for (const t of (allTasksRaw ?? [])) {
    if (!byEmp.has(t.employeeId)) byEmp.set(t.employeeId, [])
    byEmp.get(t.employeeId)!.push(t)
  }

  // Deduplicate employees by ID and apply search filter
  const allEmployees: Employee[] = []
  const seen = new Set<string>()
  for (const emp of (employeesPage?.data ?? [])) {
    if (seen.has(emp.id)) continue
    seen.add(emp.id)
    allEmployees.push(emp)
  }

  const filtered = search
    ? allEmployees.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        e.departmentName.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(search.toLowerCase()),
      )
    : allEmployees

  // Sort by join date descending (newest first — most likely to need onboarding)
  filtered.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())

  const totalEmps = allEmployees.length
  const withTasks = allEmployees.filter(e => (byEmp.get(e.id)?.length ?? 0) > 0).length
  const completed = allEmployees.filter(e => {
    const tasks = byEmp.get(e.id) ?? []
    return tasks.length > 0 && tasks.every(t => t.completed)
  }).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Onboarding</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {withTasks} / {totalEmps} employees initialized · {completed} fully complete
            </p>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Employees', value: totalEmps, color: 'text-foreground' },
            { label: 'In Progress', value: withTasks - completed, color: 'text-amber-600' },
            { label: 'Completed', value: completed, color: 'text-green-600' },
          ].map(card => (
            <div key={card.label} className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={cn('text-2xl font-bold mt-1', card.color)}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, department or code…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Employee list */}
      <div className="rounded-md border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No employees found" description="Try adjusting your search." />
        ) : (
          filtered.map(emp => (
            <EmployeeRow
              key={emp.id}
              employee={emp}
              seededTasks={byEmp.get(emp.id) ?? []}
              globalPending={isPending}
              onComplete={complete}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const user = useAuthStore(s => s.user)!

  if (user.role === 'EMPLOYEE') {
    return <EmployeeOnboarding employeeId={user.employeeId} />
  }
  return <AdminOnboarding />
}

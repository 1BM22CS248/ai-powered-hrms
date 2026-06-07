/**
 * Role: all roles
 * Data: derived from leave_requests + payroll via GET /api/notifications
 * API: /api/notifications, PATCH /api/notifications/:id/read
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { api } from '../../../lib/apiClient'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Skeleton } from '../../../components/ui/skeleton'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { formatRelative } from '../../../lib/format'
import type { Notification } from '../../../data/types'

interface BackendNotification {
  id: string; userId: string; type: string; title: string
  message: string; read: boolean; link: string | null; createdAt: string | null
}

function toNotification(b: BackendNotification): Notification {
  return {
    id: b.id,
    userId: b.userId,
    type: b.type as Notification['type'],
    title: b.title,
    message: b.message,
    read: b.read,
    link: b.link,
    createdAt: b.createdAt ?? new Date().toISOString(),
  }
}

async function fetchNotifications(): Promise<Notification[]> {
  const rows = await api.get<unknown>('/notifications')
  if (!Array.isArray(rows)) return []
  return (rows as BackendNotification[]).map(toNotification)
}

async function markRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`, {})
}

export default function NotificationsPage() {
  const user = useAuthStore(s => s.user)!
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', user.employeeId],
    queryFn: fetchNotifications,
    staleTime: 30_000,
  })

  const readMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user.employeeId] }),
  })

  const notifications = Array.isArray(data) ? data : []
  const unread = notifications.filter(n => !n.read).length

  function handleMarkAllRead() {
    for (const n of notifications.filter(n => !n.read)) readMutation.mutate(n.id)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unread > 0 && <Badge variant="destructive">{unread} new</Badge>}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={readMutation.isPending}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-1">
          {notifications.map(n => (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => { if (!n.read) readMutation.mutate(n.id) }}
              onKeyDown={e => { if (e.key === 'Enter' && !n.read) readMutation.mutate(n.id) }}
              className={`rounded-lg border p-3 cursor-pointer transition-colors ${n.read ? 'bg-card' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-medium ${!n.read ? 'text-primary' : ''}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

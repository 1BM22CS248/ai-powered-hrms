/**
 * Role: all roles
 * Data: single ticket
 * API: getTicket, setAiReply, updateTicketStatus
 * AI: getHelpdeskReply — wired here
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { getTicket, setAiReply, updateTicketStatus } from '../../../data/api/tickets'
import { getHelpdeskReply } from '../../../ai/helpdeskBot'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { formatDate, formatRelative } from '../../../lib/format'
import { TICKET_STATUSES, TICKET_CATEGORIES, TICKET_PRIORITIES } from '../../../lib/constants'
import type { TicketStatus, TicketPriority } from '../../../data/types'

const STATUS_VARIANT: Record<TicketStatus, 'destructive' | 'warning' | 'success' | 'secondary'> = {
  open: 'destructive', 'in-progress': 'warning', resolved: 'success', closed: 'secondary',
}
const PRIORITY_VARIANT: Record<TicketPriority, 'secondary' | 'info' | 'warning' | 'destructive'> = {
  low: 'secondary', medium: 'info', high: 'warning', urgent: 'destructive',
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id!),
    enabled: !!id,
  })

  const { mutate: generateReply, isPending: generating } = useMutation({
    mutationFn: async () => {
      if (!ticket) throw new Error('No ticket')
      const reply = await getHelpdeskReply(ticket)
      return setAiReply(ticket.id, reply)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] })
      toast.success('AI suggested reply generated.')
    },
    onError: () => toast.error('Failed to generate AI reply.'),
  })

  const { mutate: changeStatus } = useMutation({
    mutationFn: (status: TicketStatus) => updateTicketStatus(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] })
      toast.success('Ticket status updated.')
    },
  })

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (!ticket) return <p className="text-muted-foreground">Ticket not found.</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/helpdesk')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{ticket.ticketNumber}</h1>
            <Badge variant={STATUS_VARIANT[ticket.status]}>{TICKET_STATUSES[ticket.status]}</Badge>
            <Badge variant={PRIORITY_VARIANT[ticket.priority]}>{TICKET_PRIORITIES[ticket.priority]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            By {ticket.employeeName} · {formatRelative(ticket.createdAt)} · {TICKET_CATEGORIES[ticket.category]}
          </p>
        </div>
        <div className="flex gap-2">
          {ticket.status === 'open' && (
            <Button size="sm" variant="outline" onClick={() => changeStatus('in-progress')}>Mark In Progress</Button>
          )}
          {ticket.status === 'in-progress' && (
            <Button size="sm" variant="outline" onClick={() => changeStatus('resolved')}>Resolve</Button>
          )}
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Description</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      {/* AI Suggested Reply */}
      <Card className={ticket.aiSuggestedReply ? 'border-primary/30 bg-primary/5' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" /> AI Suggested Reply
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => generateReply()} disabled={generating}>
              {generating ? 'Generating…' : ticket.aiSuggestedReply ? 'Regenerate' : 'Generate'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ticket.aiSuggestedReply ? (
            <p className="text-sm whitespace-pre-wrap">{ticket.aiSuggestedReply}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Click Generate to get an AI-suggested reply for this ticket.</p>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Created {formatDate(ticket.createdAt)} · Updated {formatDate(ticket.updatedAt)}
        {ticket.resolvedAt && ` · Resolved ${formatDate(ticket.resolvedAt)}`}
      </div>
    </div>
  )
}

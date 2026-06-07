/**
 * Role: all roles (employees see own tickets; HR/Manager see all)
 * Data: support tickets (paginated, filtered)
 * API: getTickets
 * AI: aiSuggestedReply shown on detail page
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { Headphones } from 'lucide-react'
import { getTickets } from '../../../data/api/tickets'
import { useAuthStore } from '../../../store/authStore'
import { Pagination } from '../../../components/table/Pagination'
import { TableSkeleton } from '../../../components/table/TableSkeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { formatDate } from '../../../lib/format'
import { TICKET_STATUSES, TICKET_CATEGORIES, TICKET_PRIORITIES } from '../../../lib/constants'
import type { TicketStatus, TicketPriority } from '../../../data/types'

const STATUS_VARIANT: Record<TicketStatus, 'destructive' | 'warning' | 'success' | 'secondary'> = {
  open: 'destructive', 'in-progress': 'warning', resolved: 'success', closed: 'secondary',
}
const PRIORITY_VARIANT: Record<TicketPriority, 'secondary' | 'info' | 'warning' | 'destructive'> = {
  low: 'secondary', medium: 'info', high: 'warning', urgent: 'destructive',
}

export default function TicketListPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)!
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TicketStatus | ''>('')

  const isEmployee = user.role === 'EMPLOYEE'

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', { page, search, status, employeeId: isEmployee ? user.employeeId : '' }],
    queryFn: () => getTickets({
      page, limit: 50, search, status,
      employeeId: isEmployee ? user.employeeId : undefined,
    }),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Helpdesk</h1>
        <p className="text-sm text-muted-foreground">{data ? `${data.total} tickets` : ''}</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search tickets…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="flex-1 min-w-[180px]" />
        <Select value={status || 'all'} onValueChange={v => { setStatus(v === 'all' ? '' : v as TicketStatus); setPage(1) }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(TICKET_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={Headphones} title="No tickets found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ticket</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(t => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/helpdesk/${t.id}`)}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{t.ticketNumber}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.subject}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.employeeName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{TICKET_CATEGORIES[t.category]}</td>
                      <td className="px-4 py-3"><Badge variant={PRIORITY_VARIANT[t.priority]}>{TICKET_PRIORITIES[t.priority]}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[t.status]}>{TICKET_STATUSES[t.status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

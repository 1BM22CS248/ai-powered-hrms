/**
 * Role: HR_ADMIN
 * Data: audit logs (immutable, paginated)
 * API: getSeedData().auditLogs
 * AI: none
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import { Pagination } from '../../../components/table/Pagination'
import { TableSkeleton } from '../../../components/table/TableSkeleton'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { Input } from '../../../components/ui/input'
import { formatRelative } from '../../../lib/format'
import type { AuditLog } from '../../../data/types'

async function fetchAuditLogs(params: { page: number; limit: number; search: string }) {
  // Audit log backend not yet available — return empty
  const auditLogs: AuditLog[] = []
  let filtered = auditLogs
  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(l =>
      l.userName.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q)
    )
  }
  filtered = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const total = filtered.length
  const data = filtered.slice((params.page - 1) * params.limit, params.page * params.limit)
  return { data, total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) }
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit', { page, search }],
    queryFn: () => fetchAuditLogs({ page, limit: 50, search }),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <Input placeholder="Search by user, action, entity…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="max-w-sm" />

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <TableSkeleton rows={10} cols={5} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={Shield} title="No audit logs found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entity</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Details</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(l => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{l.userName}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{l.action}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.entity}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">{l.details}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatRelative(l.createdAt)}</td>
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

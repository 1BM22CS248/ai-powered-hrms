/**
 * Role: all roles
 * Data: single performance review
 * API: getPerformanceReviews (find by id)
 * AI: none
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { getPerformanceReviews } from '../../../data/api/performance'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { StarRating } from '../../../components/StarRating'
import { Skeleton } from '../../../components/ui/skeleton'
import { formatDate } from '../../../lib/format'

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['performance', 'review', id],
    queryFn: async () => {
      const result = await getPerformanceReviews({ limit: 5000 })
      return result.data.find(r => r.id === id) ?? null
    },
    enabled: !!id,
  })

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (!data) return <p className="text-muted-foreground">Review not found.</p>

  const metrics = [
    { label: 'Goals', value: data.goals },
    { label: 'Quality', value: data.quality },
    { label: 'Teamwork', value: data.teamwork },
    { label: 'Communication', value: data.communication },
    { label: 'Initiative', value: data.initiative },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/performance')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle>{data.employeeName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{data.period} · Reviewed by {data.reviewerName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(data.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StarRating value={data.overallRating} readOnly />
              {data.pipFlag && <Badge variant="destructive">PIP Flag</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.map(m => (
            <div key={m.label} className="flex items-center justify-between">
              <span className="text-sm">{m.label}</span>
              <StarRating value={m.value} readOnly size="sm" />
            </div>
          ))}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">Comments</p>
            <p className="text-sm">{data.comments}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

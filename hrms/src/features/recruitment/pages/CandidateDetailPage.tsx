/**
 * Role: HR_ADMIN, MANAGER
 * Data: single candidate
 * API: getCandidate, updateCandidateAiScore
 * AI: scoreResume — wired here
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { getCandidate, updateCandidateAiScore } from '../../../data/api/candidates'
import { scoreResume } from '../../../ai/resumeScorer'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { formatDate } from '../../../lib/format'
import { CANDIDATE_STATUSES } from '../../../lib/constants'
import type { CandidateStatus } from '../../../data/types'

const STATUS_VARIANT: Record<CandidateStatus, 'secondary' | 'info' | 'warning' | 'success' | 'destructive'> = {
  applied: 'secondary', screening: 'info', interview: 'warning', offer: 'info', hired: 'success', rejected: 'destructive',
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => getCandidate(id!),
    enabled: !!id,
  })

  const { mutate: doScore, isPending: scoring } = useMutation({
    mutationFn: async () => {
      if (!candidate) throw new Error('No candidate')
      const result = await scoreResume(candidate.resumeText)
      return updateCandidateAiScore(candidate.id, result.score, result.strengths, result.gaps, result.recommendation)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', id] })
      toast.success('Resume scored by AI.')
    },
    onError: () => toast.error('AI scoring failed. Please try again.'),
  })

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (!candidate) return <p className="text-muted-foreground">Candidate not found.</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/recruitment')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{candidate.firstName} {candidate.lastName}</h1>
          <p className="text-muted-foreground text-sm">{candidate.email} · {candidate.phone}</p>
          <p className="text-muted-foreground text-xs mt-0.5">{candidate.jobTitle} · Applied {formatDate(candidate.appliedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[candidate.status]}>{CANDIDATE_STATUSES[candidate.status]}</Badge>
          <Button size="sm" onClick={() => doScore()} disabled={scoring}>
            <Sparkles className="h-4 w-4 mr-1" />
            {scoring ? 'Scoring…' : 'Score with AI'}
          </Button>
        </div>
      </div>

      {/* AI Score Panel */}
      {candidate.aiScore !== null && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" /> AI Resume Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-4xl font-bold ${candidate.aiScore >= 70 ? 'text-green-600' : candidate.aiScore >= 50 ? 'text-yellow-600' : 'text-destructive'}`}>
                {candidate.aiScore}
              </span>
              <span className="text-muted-foreground text-sm">/100</span>
            </div>
            {candidate.aiStrengths && candidate.aiStrengths.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1 text-green-700 dark:text-green-400">Strengths</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {candidate.aiStrengths.map((s, i) => <li key={i} className="text-sm">{s}</li>)}
                </ul>
              </div>
            )}
            {candidate.aiGaps && candidate.aiGaps.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1 text-destructive">Gaps</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {candidate.aiGaps.map((g, i) => <li key={i} className="text-sm">{g}</li>)}
                </ul>
              </div>
            )}
            {candidate.aiRecommendation && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-1 text-muted-foreground">Recommendation</p>
                <p className="text-sm">{candidate.aiRecommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resume */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Resume</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed line-clamp-20">
            {candidate.resumeText}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

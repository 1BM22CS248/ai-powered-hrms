import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scoreResume } from '../resumeScorer'

const VALID_RESPONSE = JSON.stringify({
  score: 82,
  strengths: ['5+ years React', 'TypeScript expert', 'CI/CD experience'],
  gaps: ['No Python background'],
  recommendation: 'Strong candidate for senior frontend role.',
})

const MALFORMED_RESPONSE = 'This is not JSON at all.'

const WRONG_SHAPE = JSON.stringify({ foo: 'bar' })

describe('scoreResume', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AI_API_KEY', 'fake-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('parses a valid Gemini response correctly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: VALID_RESPONSE }] } }],
      }),
    }))

    const result = await scoreResume('Alice worked at Google for 5 years as a React engineer.')
    expect(result.score).toBe(82)
    expect(result.strengths).toHaveLength(3)
    expect(result.gaps).toHaveLength(1)
    expect(result.recommendation).toContain('frontend')
    expect(result.error).toBeUndefined()
  })

  it('returns fallback on malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: MALFORMED_RESPONSE }] } }],
      }),
    }))

    const result = await scoreResume('Some resume text.')
    expect(result.error).toBe(true)
    expect(result.score).toBe(0)
  })

  it('returns fallback on wrong JSON shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: WRONG_SHAPE }] } }],
      }),
    }))

    const result = await scoreResume('Some resume text.')
    expect(result.error).toBe(true)
  })

  it('returns fallback on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await scoreResume('Some resume text.')
    expect(result.error).toBe(true)
  })

  it('returns fallback on API error response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded',
      statusText: 'Too Many Requests',
    }))

    const result = await scoreResume('Some resume text.')
    expect(result.error).toBe(true)
  })

  it('returns fallback for empty resume text', async () => {
    const result = await scoreResume('')
    expect(result.error).toBe(true)
  })

  it('clamps score to 0-100', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ score: 150, strengths: ['a'], gaps: ['b'], recommendation: 'ok' }) }] } }],
      }),
    }))

    const result = await scoreResume('Resume text.')
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })
})

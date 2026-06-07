import { describe, it, expect, beforeAll } from 'vitest'
import { getEmployees, getEmployee } from '../employees'
import { getSeedData } from '../../seed'

// Pre-warm the seed singleton so individual tests don't hit the generation cost
beforeAll(() => { getSeedData() }, 30_000)

describe('getEmployees', () => {
  it('returns paginated results with correct shape', async () => {
    const result = await getEmployees({ page: 1, limit: 50 })
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('page', 1)
    expect(result).toHaveProperty('limit', 50)
    expect(result).toHaveProperty('totalPages')
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBe(50)
  })

  it('returns 5000 total employees', async () => {
    const result = await getEmployees({ page: 1, limit: 1 })
    expect(result.total).toBe(5000)
  })

  it('paginates correctly on page 2', async () => {
    const page1 = await getEmployees({ page: 1, limit: 50 })
    const page2 = await getEmployees({ page: 2, limit: 50 })
    expect(page1.data[0].id).not.toBe(page2.data[0].id)
    expect(page2.page).toBe(2)
  })

  it('last page has fewer or equal rows', async () => {
    const first = await getEmployees({ page: 1, limit: 50 })
    const last = await getEmployees({ page: first.totalPages, limit: 50 })
    expect(last.data.length).toBeGreaterThan(0)
    expect(last.data.length).toBeLessThanOrEqual(50)
  })

  it('returns empty data for out-of-range page', async () => {
    const result = await getEmployees({ page: 9999, limit: 50 })
    expect(result.data).toHaveLength(0)
  })

  it('filters by search query', async () => {
    const result = await getEmployees({ search: 'admin@hrms.com' })
    expect(result.total).toBeGreaterThan(0)
    result.data.forEach(e => {
      expect(e.email).toContain('admin@hrms.com')
    })
  })

  it('returns empty for search with no match', async () => {
    const result = await getEmployees({ search: 'xyzxyzxyz_no_match_12345' })
    expect(result.total).toBe(0)
    expect(result.data).toHaveLength(0)
  })

  it('filters by status', async () => {
    const result = await getEmployees({ status: 'active', limit: 100 })
    result.data.forEach(e => expect(e.status).toBe('active'))
  })
})

describe('getEmployee', () => {
  it('returns employee by id', async () => {
    const emp = await getEmployee('emp-1')
    expect(emp).not.toBeNull()
    expect(emp!.id).toBe('emp-1')
  })

  it('returns null for non-existent id', async () => {
    const emp = await getEmployee('emp-9999999')
    expect(emp).toBeNull()
  })
})

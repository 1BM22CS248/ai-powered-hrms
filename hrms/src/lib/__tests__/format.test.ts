import { describe, it, expect } from 'vitest'
import { formatINR, formatDate, formatHours, formatPercent, formatDays, getInitials } from '../format'

describe('formatINR', () => {
  it('formats zero', () => {
    expect(formatINR(0)).toMatch(/₹/)
    expect(formatINR(0)).toContain('0')
  })
  it('formats typical salary', () => {
    const result = formatINR(75000)
    expect(result).toContain('₹')
    expect(result).toContain('75')
  })
  it('handles large amounts', () => {
    const result = formatINR(1_00_000)
    expect(result).toContain('₹')
  })
  it('formats negative', () => {
    const result = formatINR(-500)
    expect(result).toContain('-')
  })
})

describe('formatDate', () => {
  it('formats a valid ISO date', () => {
    expect(formatDate('2024-01-15')).toBe('15 Jan 2024')
  })
  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—')
  })
  it('returns the input if invalid', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatHours', () => {
  it('formats whole hours', () => {
    expect(formatHours(8)).toBe('8h 0m')
  })
  it('formats decimal hours', () => {
    expect(formatHours(8.5)).toBe('8h 30m')
  })
  it('handles zero', () => {
    expect(formatHours(0)).toBe('0h 0m')
  })
})

describe('formatPercent', () => {
  it('formats 0', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })
  it('formats 100', () => {
    expect(formatPercent(100)).toBe('100.0%')
  })
  it('respects decimal places', () => {
    expect(formatPercent(75.567, 2)).toBe('75.57%')
  })
})

describe('formatDays', () => {
  it('singular', () => {
    expect(formatDays(1)).toBe('1 day')
  })
  it('plural', () => {
    expect(formatDays(5)).toBe('5 days')
  })
})

describe('getInitials', () => {
  it('returns uppercase initials', () => {
    expect(getInitials('alice', 'bob')).toBe('AB')
  })
  it('handles uppercase input', () => {
    expect(getInitials('John', 'Doe')).toBe('JD')
  })
})

import { getWorkingDaysInMonth } from '../../src/utils/dateHelpers'

describe('getWorkingDaysInMonth', () => {
  it('returns 23 for January 2025', () => {
    expect(getWorkingDaysInMonth('2025-01')).toBe(23)
  })

  it('returns 20 for February 2025', () => {
    expect(getWorkingDaysInMonth('2025-02')).toBe(20)
  })
})

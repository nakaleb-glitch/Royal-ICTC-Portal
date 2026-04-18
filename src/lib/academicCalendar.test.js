import { describe, expect, it } from 'vitest'
import { getCurrentWeekIndexWithOverride, getWeekIndexForDate } from './academicCalendar'

const createWindowWithSessionStorage = (initial = {}) => {
  const store = { ...initial }
  return {
    sessionStorage: {
      getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
      setItem: (key, value) => {
        store[key] = String(value)
      },
      removeItem: (key) => {
        delete store[key]
      },
    },
  }
}

describe('getWeekIndexForDate', () => {
  it('returns week 0 before term start', () => {
    expect(getWeekIndexForDate(new Date('2026-08-01T00:00:00'))).toBe(0)
  })

  it('returns week 0 at term start', () => {
    expect(getWeekIndexForDate(new Date('2026-08-17T00:00:00'))).toBe(0)
  })

  it('returns expected week for in-term date', () => {
    expect(getWeekIndexForDate(new Date('2026-09-14T00:00:00'))).toBe(4)
  })

  it('caps to final supported week', () => {
    expect(getWeekIndexForDate(new Date('2027-12-31T00:00:00'))).toBe(39)
  })
})

describe('getCurrentWeekIndexWithOverride', () => {
  it('prefers debug_date_override over legacy debug_week_override', () => {
    globalThis.window = createWindowWithSessionStorage({
      debug_date_override: '2026-09-14',
      debug_week_override: '2',
    })

    expect(getCurrentWeekIndexWithOverride(40)).toBe(4)
  })

  it('falls back to legacy debug_week_override when date override is invalid', () => {
    globalThis.window = createWindowWithSessionStorage({
      debug_date_override: 'not-a-date',
      debug_week_override: '7',
    })

    expect(getCurrentWeekIndexWithOverride(40)).toBe(7)
  })

  it('uses clamped current date week when no overrides are set', () => {
    globalThis.window = createWindowWithSessionStorage()

    const result = getCurrentWeekIndexWithOverride(40)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThan(40)
  })
})

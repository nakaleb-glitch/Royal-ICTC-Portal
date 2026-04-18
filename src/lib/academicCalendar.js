const ACADEMIC_YEAR_START = new Date('2026-08-17T00:00:00')
const ACADEMIC_WEEK_COUNT = 40

const parseLocalDateInput = (value) => {
  if (!value || typeof value !== 'string') return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!year || !month || !day) return null

  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export const getWeekIndexForDate = (date = new Date()) => {
  const targetDate = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(targetDate.getTime())) return 0
  if (targetDate < ACADEMIC_YEAR_START) return 0

  const diffMs = targetDate.getTime() - ACADEMIC_YEAR_START.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const weekIndex = Math.floor(diffDays / 7)
  return Math.max(0, Math.min(ACADEMIC_WEEK_COUNT - 1, weekIndex))
}

export const getDebugDateOverride = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null
  const storedDate = window.sessionStorage.getItem('debug_date_override')
  return parseLocalDateInput(storedDate)
}

export const getCurrentCalendarDate = () => {
  return getDebugDateOverride() || new Date()
}

export const getCurrentWeekIndexWithOverride = (allWeeksLength) => {
  const maxWeeks = Number(allWeeksLength) || ACADEMIC_WEEK_COUNT
  const overrideDate = getDebugDateOverride()
  if (overrideDate) {
    const dateOverrideWeek = getWeekIndexForDate(overrideDate)
    if (Number.isFinite(dateOverrideWeek) && dateOverrideWeek >= 0 && dateOverrideWeek < maxWeeks) {
      return dateOverrideWeek
    }
  }

  if (typeof window !== 'undefined' && window.sessionStorage) {
    const override = window.sessionStorage.getItem('debug_week_override')
    if (override !== null) {
      const idx = Number(override)
      if (idx >= 0 && idx < maxWeeks) return idx
    }
  }

  return Math.max(0, Math.min(maxWeeks - 1, getWeekIndexForDate(new Date())))
}

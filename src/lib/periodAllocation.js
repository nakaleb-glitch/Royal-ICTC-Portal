/** @typedef {'bilingual' | 'integrated'} Programme */

export const STORAGE_KEY = 'period_allocation_v1'

export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8]

/** Minutes per period */
export const PRIMARY_MINUTES = 35
export const SECONDARY_MINUTES = 40

export const CONTRACT_HOURS_WEEK = 40

export const SUBJECTS_BILINGUAL = ['ESL', 'Mathematics', 'Science', 'Global Perspectives']

export const SUBJECTS_INTEGRATED = ['ESL', 'VN ESL', 'Mathematics', 'Science', 'Global Perspectives']

/**
 * Column groups: label shown in header, key prefix for slot ids, number of cells per row.
 */
export const BILINGUAL_GROUPS = [
  { key: 'esl', label: 'ESL', slots: 8 },
  { key: 'math', label: 'Mathematics', slots: 5 },
  { key: 'science', label: 'Science', slots: 5 },
  { key: 'gp', label: 'GP', slots: 2 },
]

export const INTEGRATED_GROUPS = [
  { key: 'esl', label: 'ESL', slots: 6 },
  { key: 'vnEsl', label: 'VN ESL', slots: 6 },
  { key: 'math', label: 'Mathematics', slots: 4 },
  { key: 'science', label: 'Science', slots: 4 },
]

/**
 * @param {Programme} programme
 */
export function getGroups(programme) {
  return programme === 'bilingual' ? BILINGUAL_GROUPS : INTEGRATED_GROUPS
}

/**
 * Ordered slot descriptors for building headers and rows.
 * @param {Programme} programme
 * @returns {{ id: string, groupKey: string, groupLabel: string, indexInGroup: number }[]}
 */
export function slotDefinitions(programme) {
  const groups = getGroups(programme)
  const out = []
  for (const g of groups) {
    for (let i = 0; i < g.slots; i++) {
      out.push({
        id: `${g.key}:${i}`,
        groupKey: g.key,
        groupLabel: g.label,
        indexInGroup: i,
      })
    }
  }
  return out
}

/**
 * @param {Programme} programme
 */
export function subjectsForProgramme(programme) {
  return programme === 'bilingual' ? SUBJECTS_BILINGUAL : SUBJECTS_INTEGRATED
}

/**
 * Cell value: "primary|ESL" or "secondary|Mathematics" or ""
 * @param {string} level
 * @param {string} subject
 */
export function encodeCell(level, subject) {
  if (!level || !subject) return ''
  return `${level}|${subject}`
}

/**
 * @param {string} raw
 * @returns {{ level: string, subject: string } | null}
 */
export function decodeCell(raw) {
  if (!raw || typeof raw !== 'string') return null
  const pipe = raw.indexOf('|')
  if (pipe <= 0) return null
  const level = raw.slice(0, pipe)
  const subject = raw.slice(pipe + 1)
  if (level !== 'primary' && level !== 'secondary') return null
  if (!subject) return null
  return { level, subject }
}

/**
 * @param {Record<number, Record<string, string>>} assignmentsByGrade grade -> slotId -> raw cell
 * @param {Programme} programme
 */
export function computeSummary(assignmentsByGrade, programme) {
  const slots = slotDefinitions(programme)
  let assignedPeriods = 0
  let primaryPeriods = 0
  let secondaryPeriods = 0

  for (const grade of GRADES) {
    const row = assignmentsByGrade[grade] || {}
    for (const { id } of slots) {
      const raw = row[id] ?? ''
      const parsed = decodeCell(raw)
      if (!parsed) continue
      assignedPeriods += 1
      if (parsed.level === 'primary') primaryPeriods += 1
      else secondaryPeriods += 1
    }
  }

  const teachingHours =
    (primaryPeriods * PRIMARY_MINUTES) / 60 + (secondaryPeriods * SECONDARY_MINUTES) / 60

  const lessonPreps = assignedPeriods / 2
  const prepTimeHours = lessonPreps * 1.5
  const adminTimeHours = CONTRACT_HOURS_WEEK - teachingHours - prepTimeHours

  return {
    assignedPeriods,
    primaryPeriods,
    secondaryPeriods,
    teachingHours,
    lessonPreps,
    prepTimeHours,
    adminTimeHours,
  }
}

/**
 * @param {Programme} programme
 * @returns {Record<number, Record<string, string>>}
 */
export function createEmptyAssignments(programme) {
  const slots = slotDefinitions(programme)
  const emptyRow = {}
  for (const { id } of slots) emptyRow[id] = ''
  const byGrade = {}
  for (const g of GRADES) {
    byGrade[g] = { ...emptyRow }
  }
  return byGrade
}

/**
 * @param {unknown} data
 * @returns {{ bilingual: Record<number, Record<string, string>>, integrated: Record<number, Record<string, string>> } | null}
 */
export function normalizePersistedState(data) {
  if (!data || typeof data !== 'object') return null
  const bilingual = createEmptyAssignments('bilingual')
  const integrated = createEmptyAssignments('integrated')

  for (const prog of ['bilingual', 'integrated']) {
    const source = data[prog]
    const target = prog === 'bilingual' ? bilingual : integrated
    const slotIds = new Set(slotDefinitions(prog).map((s) => s.id))
    if (!source || typeof source !== 'object') continue
    for (const g of GRADES) {
      const row = source[g] ?? source[String(g)]
      if (!row || typeof row !== 'object') continue
      for (const id of slotIds) {
        const v = row[id]
        if (typeof v === 'string') target[g][id] = v
      }
    }
  }

  return { bilingual, integrated }
}

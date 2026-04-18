import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import {
  CONTRACT_HOURS_WEEK,
  GRADES,
  PRIMARY_MINUTES,
  SECONDARY_MINUTES,
  STORAGE_KEY,
  computeSummary,
  createEmptyAssignments,
  encodeCell,
  getGroups,
  normalizePersistedState,
  slotDefinitions,
  subjectsForProgramme,
} from '../../lib/periodAllocation'

const SAVE_DEBOUNCE_MS = 400

function buildSelectOptions(programme) {
  const subjects = subjectsForProgramme(programme)
  const opts = [{ value: '', label: '—' }]
  for (const level of ['primary', 'secondary']) {
    const levelLabel = level === 'primary' ? 'Primary' : 'Secondary'
    for (const subject of subjects) {
      opts.push({
        value: encodeCell(level, subject),
        label: `${levelLabel} · ${subject}`,
      })
    }
  }
  return opts
}

export default function PeriodAllocation() {
  const navigate = useNavigate()
  const saveTimerRef = useRef(null)

  const [activeTab, setActiveTab] = useState(
    /** @type {'bilingual' | 'integrated'} */ ('bilingual'),
  )
  const [data, setData] = useState(() => ({
    bilingual: createEmptyAssignments('bilingual'),
    integrated: createEmptyAssignments('integrated'),
  }))
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        const normalized = normalizePersistedState(parsed)
        if (normalized) {
          setData(normalized)
        }
      }
    } catch (e) {
      console.warn('period allocation load failed', e)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (e) {
        console.warn('period allocation save failed', e)
      }
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [data, hydrated])

  const bilingualSlots = useMemo(() => slotDefinitions('bilingual'), [])
  const integratedSlots = useMemo(() => slotDefinitions('integrated'), [])
  const slots = activeTab === 'bilingual' ? bilingualSlots : integratedSlots
  const groups = useMemo(() => getGroups(activeTab), [activeTab])

  const summary = useMemo(
    () => computeSummary(data[activeTab], activeTab),
    [data, activeTab],
  )

  const bilingualOptions = useMemo(() => buildSelectOptions('bilingual'), [])
  const integratedOptions = useMemo(() => buildSelectOptions('integrated'), [])
  const selectOptions = activeTab === 'bilingual' ? bilingualOptions : integratedOptions

  const updateCell = useCallback((grade, slotId, value) => {
    setData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [grade]: {
          ...prev[activeTab][grade],
          [slotId]: value,
        },
      },
    }))
  }, [activeTab])

  const handleResetTab = () => {
    if (!window.confirm(`Clear all entries for the ${activeTab === 'bilingual' ? 'Bilingual' : 'Integrated'} tab?`)) return
    setData((prev) => ({
      ...prev,
      [activeTab]: createEmptyAssignments(activeTab),
    }))
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'period_allocation.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const normalized = normalizePersistedState(parsed)
      if (normalized) {
        setData(normalized)
      } else {
        window.alert('Could not read allocation file. Expected bilingual / integrated grade data.')
      }
    } catch (err) {
      console.error(err)
      window.alert('Import failed: invalid JSON.')
    }
    e.target.value = ''
  }

  const fmt2 = (n) => n.toFixed(2)
  const fmt1 = (n) => n.toFixed(1)

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity text-sm"
            style={{ backgroundColor: '#1f86c7' }}
          >
            ← Go Back
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            >
              Download JSON
            </button>
            <label className="cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600">
              Load JSON
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
            </label>
            <button
              type="button"
              onClick={handleResetTab}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              Reset tab
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Period allocation
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Planning grid for recruitment (G1–G8). Drafts save in this browser. Weekly contract hours for admin time: {CONTRACT_HOURS_WEEK} h.
        </p>

        <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('bilingual')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 -mb-px transition-colors ${
              activeTab === 'bilingual'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Bilingual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integrated')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 -mb-px transition-colors ${
              activeTab === 'integrated'
                ? 'border-teal-600 text-teal-700 dark:text-teal-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Integrated
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <table className="min-w-max w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th
                  className="sticky left-0 z-20 px-2 py-2 text-left font-semibold border-b border-r border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 min-w-[3rem]"
                >
                  Grade
                </th>
                {groups.map((g) => (
                  <th
                    key={g.key}
                    colSpan={g.slots}
                    className="px-1 py-2 text-center font-semibold border-b border-slate-200 dark:border-slate-600"
                  >
                    {g.label} ({g.slots})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRADES.map((grade) => (
                <tr key={grade} className="odd:bg-white even:bg-slate-50/80 dark:odd:bg-slate-900 dark:even:bg-slate-900/70">
                  <th
                    className="sticky left-0 z-10 px-2 py-1 text-left font-medium border-t border-r border-slate-200 dark:border-slate-600 bg-inherit whitespace-nowrap"
                  >
                    G{grade}
                  </th>
                  {slots.map(({ id }) => (
                    <td key={id} className="border-t border-slate-200 dark:border-slate-700 p-0.5 align-middle">
                      <select
                        value={data[activeTab][grade][id] ?? ''}
                        onChange={(e) => updateCell(grade, id, e.target.value)}
                        className="w-[min(8.5rem,22vw)] max-w-[140px] text-[11px] leading-tight rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-1 px-0.5"
                      >
                        {selectOptions.map((o) => (
                          <option key={o.value || 'empty'} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            Summary ({activeTab === 'bilingual' ? 'Bilingual' : 'Integrated'})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full max-w-xl text-sm">
              <tbody>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">Assigned periods</td>
                  <td className="px-3 py-2 text-right tabular-nums">{summary.assignedPeriods}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">Total teaching hours</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt2(summary.teachingHours)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50">
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs" colSpan={2}>
                    Primary: {summary.primaryPeriods} × {PRIMARY_MINUTES} min + Secondary: {summary.secondaryPeriods} × {SECONDARY_MINUTES} min
                  </td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">Lesson preps (periods ÷ 2)</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt1(summary.lessonPreps)}</td>
                </tr>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">Prep time</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt2(summary.prepTimeHours)} h</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">Admin time</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${summary.adminTimeHours < 0 ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                    {fmt2(summary.adminTimeHours)} h
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {summary.adminTimeHours < 0 && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Admin time is negative: assigned load exceeds the {CONTRACT_HOURS_WEEK} h week after prep.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}

import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { profile, user } = useAuth()
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')

  useEffect(() => {
    if (profile) fetchDashboardData()
  }, [profile])

  const fetchDashboardData = async () => {
    setLoading(true)

    if (profile.role === 'admin') {
      const [{ data: classData }, { data: studentData }] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('students').select('*'),
      ])
      setClasses(classData || [])
      setStudents(studentData || [])
      setLoading(false)
      return
    }

    let query = supabase.from('classes').select('*').order('name')
    query = query.eq('teacher_id', profile.id)
    const { data } = await query
    setClasses(data || [])
    setLoading(false)
  }

  const levelLabel = (l) => ({
    primary: 'Primary',
    lower_secondary: 'Lower Secondary',
    upper_secondary: 'Upper Secondary',
    high_school: 'High School',
  }[l] || l)

  const programmeLabel = (p) => p === 'bilingual' ? 'Bilingual' : 'Integrated'

  const programmeBadgeStyle = (p) => p === 'bilingual'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-teal-100 text-teal-700'

  const extractGrade = (value) => {
    if (!value) return null
    const match = String(value).trim().match(/^(\d+)/)
    return match ? match[1] : null
  }

  const normalizeProgramme = (value) => {
    if (!value) return 'unknown'
    const v = String(value).trim().toLowerCase()
    if (v === 'bilingual') return 'bilingual'
    if (v === 'integrated') return 'integrated'
    return 'unknown'
  }

  const normalizeLevel = (value) => {
    if (!value) return null
    const v = String(value).trim().toLowerCase()
    if (v === 'primary') return 'primary'
    if (v === 'secondary' || v === 'lower_secondary' || v === 'upper_secondary' || v === 'high_school') {
      return 'secondary'
    }
    return v
  }

  const getHomeroom = (className) => {
    if (!className) return null
    return String(className).trim().split(/\s+/)[0] || null
  }

  const getUniqueClasses = () => {
    const byHomeroom = new Map()
    for (const cls of classes) {
      const homeroom = getHomeroom(cls.name)
      if (!homeroom) continue

      const grade = extractGrade(homeroom) || 'Unknown'
      const programme = normalizeProgramme(cls.programme)
      const level = cls.level || null

      const existing = byHomeroom.get(homeroom)
      if (!existing) {
        byHomeroom.set(homeroom, { homeroom, grade, programme, level })
        continue
      }

      // If programme differs across subject-rows for same homeroom, treat as unknown/mixed.
      if (existing.programme !== programme) {
        existing.programme = 'unknown'
      }
      if (!existing.level && level) {
        existing.level = level
      }
    }

    return Array.from(byHomeroom.values())
  }

  const getFilteredUniqueClasses = () => getUniqueClasses().filter(c =>
    (!levelFilter || normalizeLevel(c.level) === levelFilter) &&
    (gradeFilter === 'all' || c.grade === gradeFilter)
  )

  const getFilteredStudents = () => students.filter(student =>
    (!levelFilter || normalizeLevel(student.level) === levelFilter) &&
    (gradeFilter === 'all' || extractGrade(student.class) === gradeFilter)
  )

  const filteredUniqueClasses = getFilteredUniqueClasses()
  const filteredStudents = getFilteredStudents()

  const levelScopedClasses = classes.filter(c =>
    !levelFilter || normalizeLevel(c.level) === levelFilter
  )
  const levelScopedStudents = students.filter(s =>
    !levelFilter || normalizeLevel(s.level) === levelFilter
  )

  const gradeList = Array.from(new Set([
    ...levelScopedClasses.map(c => extractGrade(c.name)),
    ...levelScopedStudents.map(s => extractGrade(s.class)),
  ].filter(Boolean))).sort((a, b) => Number(a) - Number(b))

  const buildSnapshotByGrade = (items, getGrade, getProgramme) => {
    const byGrade = {}
    for (const item of items) {
      const grade = getGrade(item) || 'Unknown'
      const programme = normalizeProgramme(getProgramme(item))
      if (!byGrade[grade]) byGrade[grade] = { grade, total: 0, bilingual: 0, integrated: 0, unknown: 0 }
      byGrade[grade].total += 1
      if (programme === 'bilingual') byGrade[grade].bilingual += 1
      else if (programme === 'integrated') byGrade[grade].integrated += 1
      else byGrade[grade].unknown += 1
    }

    return Object.values(byGrade).sort((a, b) => {
      if (a.grade === 'Unknown') return 1
      if (b.grade === 'Unknown') return -1
      return Number(a.grade) - Number(b.grade)
    })
  }

  const classSnapshot = buildSnapshotByGrade(
    filteredUniqueClasses,
    c => c.grade,
    c => c.programme
  )

  const studentSnapshot = buildSnapshotByGrade(
    filteredStudents,
    s => extractGrade(s.class),
    s => s.programme
  )

  const totalUniqueClassCount = filteredUniqueClasses.length
  const totalStudentCount = filteredStudents.length

  const sumSnapshot = (rows) => rows.reduce((acc, r) => ({
    total: acc.total + r.total,
    bilingual: acc.bilingual + r.bilingual,
    integrated: acc.integrated + r.integrated,
    unknown: acc.unknown + r.unknown,
  }), { total: 0, bilingual: 0, integrated: 0, unknown: 0 })

  const classTotals = sumSnapshot(classSnapshot)
  const studentTotals = sumSnapshot(studentSnapshot)

  useEffect(() => {
    if (gradeFilter === 'all') return
    if (!gradeList.includes(gradeFilter)) {
      setGradeFilter('all')
    }
  }, [levelFilter, gradeFilter, gradeList])

  const CARD_ACCENT = {
    students: '#d1232a',
    classes: '#1f86c7',
    users: '#ffc612',
    resources: '#1f86c7',
    class: '#d1232a',
  }

  const welcomeLabel = profile?.full_name || user?.email
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : 'Teacher'
  const yearLabel = '2026–27'

  return (
    <Layout>
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600">
          <span className="font-medium text-gray-700">Welcome, {welcomeLabel}</span>
          <span className="text-gray-300">•</span>
          <span>{roleLabel}</span>
          <span className="text-gray-300">•</span>
          <span>{yearLabel}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading...</div>
      ) : profile?.role === 'admin' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left column — Admin tools */}
          <div className="lg:col-span-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Tools</h3>
            <div className="space-y-4">
              <Link
                to="/admin/students"
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-all block"
                style={{ borderTopColor: CARD_ACCENT.students, borderTopWidth: 3 }}
              >
                <div className="font-semibold text-gray-900">Student Management</div>
                <div className="text-sm text-gray-500 mt-1">Add, edit or remove student accounts.</div>
              </Link>
              <Link
                to="/admin/classes"
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-all block"
                style={{ borderTopColor: CARD_ACCENT.classes, borderTopWidth: 3 }}
              >
                <div className="font-semibold text-gray-900">Class Management</div>
                <div className="text-sm text-gray-500 mt-1">Add, edit or remove classes.</div>
              </Link>
              <Link
                to="/admin/users"
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-all block"
                style={{ borderTopColor: CARD_ACCENT.users, borderTopWidth: 3 }}
              >
                <div className="font-semibold text-gray-900">Teacher Management</div>
                <div className="text-sm text-gray-500 mt-1">View, add, edit or remove teacher accounts.</div>
              </Link>
              <Link
                to="/admin/resources"
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-all block"
                style={{ borderTopColor: CARD_ACCENT.resources, borderTopWidth: 3 }}
              >
                <div className="font-semibold text-gray-900">Resource Management</div>
                <div className="text-sm text-gray-500 mt-1">Add, edit or remove resources.</div>
              </Link>
            </div>
          </div>

          {/* Right column — Insights */}
          <div className="lg:col-span-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Insights</h3>
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Level</label>
                    <select
                      value={levelFilter}
                      onChange={e => {
                        setLevelFilter(e.target.value)
                        setGradeFilter('all')
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Level</option>
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Grade</label>
                    <select
                      value={gradeFilter}
                      onChange={e => setGradeFilter(e.target.value)}
                      disabled={!levelFilter}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="all">{!levelFilter ? 'Select level first' : 'All Grades'}</option>
                      {gradeList.map(g => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <SnapshotCard
                  title="Classes Snapshot"
                  color="#1f86c7"
                  totals={classTotals}
                  metricColors={{
                    total: '#d1232a',
                    bilingual: '#1f86c7',
                    integrated: '#ffc612',
                  }}
                />
                <SnapshotCard
                  title="Students Snapshot"
                  color="#d1232a"
                  totals={studentTotals}
                  metricColors={{
                    total: '#d1232a',
                    bilingual: '#1f86c7',
                    integrated: '#ffc612',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          {profile?.role === 'admin'
            ? 'No classes yet. Create one in the Classes section.'
            : 'No classes assigned yet. Contact your administrator.'}
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Classes</h3>
        <div className="grid grid-cols-3 gap-4">
          {classes.map(cls => (
            <Link
              key={cls.id}
              to={`/class/${cls.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-all"
              style={{ borderTopColor: CARD_ACCENT.class, borderTopWidth: 3 }}
            >
              <div className="font-semibold text-gray-900 mb-1">{cls.name}</div>
              <div className="text-sm text-gray-500">{cls.subject}</div>
              <div className="mt-3 flex gap-2">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {levelLabel(cls.level)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${programmeBadgeStyle(cls.programme)}`}>
                  {programmeLabel(cls.programme)}
                </span>
              </div>
            </Link>
          ))}
        </div>
        </>
      )}
    </Layout>
  )
}

function SnapshotCard({ title, color, totals, metricColors }) {
  const cardStyle = (hex) => ({
    borderColor: hex,
    backgroundColor: `${hex}1A`, // subtle tint
  })

  const valueStyle = (hex) => ({ color: hex })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ borderTopColor: color, borderTopWidth: 3 }}>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="rounded-lg border p-3" style={cardStyle(metricColors.total)}>
          <div className="text-[11px] text-gray-600">Total</div>
          <div className="text-lg font-bold" style={valueStyle(metricColors.total)}>{totals.total}</div>
        </div>
        <div className="rounded-lg border p-3" style={cardStyle(metricColors.bilingual)}>
          <div className="text-[11px] text-gray-600">Bilingual</div>
          <div className="text-lg font-bold" style={valueStyle(metricColors.bilingual)}>{totals.bilingual}</div>
        </div>
        <div className="rounded-lg border p-3" style={cardStyle(metricColors.integrated)}>
          <div className="text-[11px] text-gray-600">Integrated</div>
          <div className="text-lg font-bold" style={valueStyle(metricColors.integrated)}>{totals.integrated}</div>
        </div>
      </div>
    </div>
  )
}

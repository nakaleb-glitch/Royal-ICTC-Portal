import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'

const SUBJECTS = {
  primary: ['ESL', 'Mathematics', 'Science', 'Global Perspectives'],
  lower_secondary: ['ESL', 'Mathematics', 'Science', 'Global Perspectives'],
  upper_secondary: ['ESL', 'Mathematics', 'Science', 'Global Perspectives'],
  high_school: ['ESL', 'Mathematics', 'Science', 'Global Perspectives'],
}

export default function Classes() {
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', subject: '', level: 'primary', programme: 'bilingual', teacher_id: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchClasses()
    fetchTeachers()
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('classes')
      .select('*, users(full_name, email)')
      .order('name')
    setClasses(data || [])
    setLoading(false)
  }

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email')
      .order('full_name')
    setTeachers(data || [])
  }

  const handleSubmit = async () => {
  if (!form.name || !form.subject || !form.level || !form.programme) return
  setSaving(true)

  // Step 1: Create the class
  const { data: newClass, error: classError } = await supabase
    .from('classes')
    .insert({
      name: form.name,
      subject: form.subject,
      level: form.level,
      programme: form.programme,
      teacher_id: form.teacher_id || null,
      academic_year: '2026-27'
    })
    .select()
    .single()

  if (classError) {
    setMessage({ type: 'error', text: classError.message })
    setSaving(false)
    return
  }

  // Step 2: Extract homeroom code from class name (e.g. "2B2 ESL" → "2B2")
  const homeroom = form.name.split(' ')[0]

  // Step 3: Find all students in that homeroom
  const { data: matchedStudents, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('class', homeroom)

  if (studentError) {
    setMessage({ type: 'error', text: 'Class created but could not find students: ' + studentError.message })
    setSaving(false)
    return
  }

  // Step 4: Enrol them all into the class
  if (matchedStudents.length > 0) {
    const enrolments = matchedStudents.map(s => ({
      class_id: newClass.id,
      student_id: s.id
    }))

    const { error: enrolError } = await supabase
      .from('class_students')
      .insert(enrolments)

    if (enrolError) {
      setMessage({ type: 'error', text: 'Class created but enrolment failed: ' + enrolError.message })
      setSaving(false)
      return
    }

    setMessage({ type: 'success', text: `Class created and ${matchedStudents.length} students enrolled automatically.` })
  } else {
    setMessage({ type: 'success', text: 'Class created. No students found for homeroom ' + homeroom + '.' })
  }

  setForm({ name: '', subject: '', level: 'primary', programme: 'bilingual', teacher_id: '' })
  setShowForm(false)
  fetchClasses()
  setSaving(false)
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

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
          <p className="text-gray-500 text-sm mt-1">{classes.length} classes · 2026–27</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ New Class'}
        </button>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Create New Class</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Class Name</label>
              <input
                type="text"
                placeholder="e.g. Primary 5A ESL"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Level</label>
              <select
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value, subject: '' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="primary">Primary</option>
                <option value="lower_secondary">Lower Secondary</option>
                <option value="upper_secondary">Upper Secondary</option>
                <option value="high_school">High School</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Programme</label>
              <select
                value={form.programme}
                onChange={e => setForm({ ...form, programme: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bilingual">Bilingual</option>
                <option value="integrated">Integrated</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Subject</label>
              <select
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select subject</option>
                {SUBJECTS[form.level].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Assign Teacher</label>
              <select
                value={form.teacher_id}
                onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300"
          >
            {saving ? 'Creating...' : 'Create Class'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No classes yet. Create one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Class Name</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Level</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Programme</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Subject</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Teacher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classes.map(cls => (
                <tr key={cls.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{cls.name}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      {levelLabel(cls.level)}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${programmeBadgeStyle(cls.programme)}`}>
                      {programmeLabel(cls.programme)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{cls.subject}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {cls.users?.full_name || cls.users?.email || <span className="text-gray-400 italic">Unassigned</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const TIMETABLE = [
  { period: 1, primary: '08:00 - 08:35', secondary: '08:00 - 08:40', label: 'Period 1' },
  { period: 2, primary: '08:35 - 09:10', secondary: '08:45 - 09:25', label: 'Period 2' },
  { period: 3, primary: '09:30 - 10:05', secondary: '09:30 - 10:10', label: 'Period 3' },
  { period: 4, primary: '10:05 - 10:40', secondary: '10:25 - 11:05', label: 'Period 4' },
  { period: 5, primary: '10:40 - 11:15', secondary: '11:10 - 11:50', label: 'Period 5' },
  { period: null, primary: '11:30 - 13:00', secondary: '11:50 - 13:20', label: 'Lunch - Nap Time', isBreak: true },
  { period: 6, primary: '13:30 - 14:05', secondary: '13:30 - 14:10', label: 'Period 6' },
  { period: 7, primary: '14:05 - 14:40', secondary: '14:15 - 14:55', label: 'Period 7' },
  { period: 8, primary: '15:20 - 15:55', secondary: '15:20 - 16:00', label: 'Period 8' },
  { period: 9, primary: '15:55 - 16:30', secondary: '16:05 - 16:45', label: 'Period 9' },
]

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

const PRIMARY_CLASSES = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C', '5A', '5B', '5C', '6A', '6B', '6C']
const SECONDARY_CLASSES = ['7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B']

const SUBJECTS = [
  'ESL', 'Mathematics', 'Science', 'Global Perspectives', 'English', 'Vietnamese',
  'Physical Education', 'Art', 'Music', 'Computer Science', 'Chemistry', 'Physics',
  'Biology', 'History', 'Geography', 'Economics', 'Business'
]

export default function TeacherSchedules() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [selectedLevel, setSelectedLevel] = useState('primary')
  const [schedules, setSchedules] = useState({})
  const [teachers, setTeachers] = useState([])
  const [editingCell, setEditingCell] = useState(null)
  const [editForm, setEditForm] = useState({ teacher_id: '', subject: '' })
  const [saving, setSaving] = useState(false)

  const classes = selectedLevel === 'primary' ? PRIMARY_CLASSES : SECONDARY_CLASSES

  useEffect(() => {
    fetchTeachers()
    fetchSchedules()
  }, [selectedLevel])

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'teacher')
      .order('full_name')
    setTeachers(data || [])
  }

  const fetchSchedules = async () => {
    const { data } = await supabase
      .from('teacher_schedules')
      .select('*')
      .eq('level', selectedLevel)
    if (data) {
      const mapped = {}
      data.forEach(s => {
        mapped[`${s.class_name}-${s.day}-${s.period}`] = s
      })
      setSchedules(mapped)
    }
  }

  const openEditModal = (className, day, period) => {
    const existing = schedules[`${className}-${day}-${period}`]
    setEditForm({
      teacher_id: existing?.teacher_id || '',
      subject: existing?.subject || ''
    })
    setEditingCell({ className, day, period })
  }

  const saveSchedule = async () => {
    if (!editForm.teacher_id || !editForm.subject) return
    setSaving(true)

    await supabase
      .from('teacher_schedules')
      .upsert({
        level: selectedLevel,
        class_name: editingCell.className,
        day: editingCell.day,
        period: editingCell.period,
        teacher_id: editForm.teacher_id,
        subject: editForm.subject
      }, {
        onConflict: 'level, class_name, day, period'
      })

    setSaving(false)
    setEditingCell(null)
    fetchSchedules()
  }

  const clearSchedule = async () => {
    setSaving(true)
    await supabase
      .from('teacher_schedules')
      .delete()
      .eq('level', selectedLevel)
      .eq('class_name', editingCell.className)
      .eq('day', editingCell.day)
      .eq('period', editingCell.period)
    setSaving(false)
    setEditingCell(null)
    fetchSchedules()
  }

  const getTeacherName = (id) => {
    const teacher = teachers.find(t => t.id === id)
    return teacher?.full_name || 'Unknown'
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
            style={{ backgroundColor: '#1f86c7' }}
          >
            ← Go Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedLevel('primary')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-opacity ${
                selectedLevel === 'primary'
                  ? 'text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={selectedLevel === 'primary' ? { backgroundColor: '#d1232a' } : {}}
            >
              Primary
            </button>
            <button
              onClick={() => setSelectedLevel('secondary')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-opacity ${
                selectedLevel === 'secondary'
                  ? 'text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={selectedLevel === 'secondary' ? { backgroundColor: '#d1232a' } : {}}
            >
              Secondary
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Teacher Schedule Management</h2>
        <p className="text-sm text-gray-500 mt-1">Click any cell to assign teacher and subject</p>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm table-fixed min-w-[1400px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left font-medium text-gray-600 w-[180px]">Class</th>
              {DAYS.map(day => (
                <th key={day} className="px-3 py-2 text-center font-medium text-gray-600">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map(cls => (
              <tr key={cls} className="border-b border-gray-100">
                <td className="px-3 py-2 border-r border-gray-100 font-medium text-gray-800 bg-gray-50">
                  {cls}
                </td>
                {[0,1,2,3,4].map(day => {
                  const cells = []
                  TIMETABLE.forEach((row, pidx) => {
                    if (row.isBreak) return

                    const schedule = schedules[`${cls}-${day}-${row.period}`]
                    cells.push(
                      <td
                        key={`${day}-${row.period}`}
                        className={`px-1 py-1 border-r border-gray-100 align-top ${pidx === 5 ? 'border-t border-gray-300' : ''}`}
                      >
                        <button
                          onClick={() => openEditModal(cls, day, row.period)}
                          className="w-full min-h-[45px] p-1 rounded border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors text-xs text-left"
                        >
                          {schedule ? (
                            <div>
                              <div className="font-medium text-gray-800 truncate">{getTeacherName(schedule.teacher_id)}</div>
                              <div className="text-gray-600 truncate">{schedule.subject}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">+</span>
                          )}
                        </button>
                      </td>
                    )
                  })

                  return cells
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="text-base font-semibold text-gray-900">Edit Schedule</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Class {editingCell.className} • {DAYS[editingCell.day]} • Period {editingCell.period}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Teacher</label>
                <select
                  value={editForm.teacher_id}
                  onChange={(e) => setEditForm({ ...editForm, teacher_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Select teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
                <select
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={clearSchedule}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-red-600 text-sm font-medium hover:bg-red-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSchedule}
                  disabled={saving || !editForm.teacher_id || !editForm.subject}
                  className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: '#1f86c7' }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
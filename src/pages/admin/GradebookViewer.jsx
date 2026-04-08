import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import { useNavigate } from 'react-router-dom'

const TERMS = [
  { key: 'midterm_1', label: 'Midterm 1' },
  { key: 'final_1', label: 'Final 1' },
  { key: 'midterm_2', label: 'Midterm 2' },
  { key: 'final_2', label: 'Final 2' },
]

const fmt = (n) => n != null ? n.toFixed(1) : '—'
const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
const pct = (score, total) => (total > 0 ? (score / total) * 100 : null)

const letterGradeFromPercentage = (score) => {
  if (score == null) return '—'
  if (score >= 90.5) return 'A*'
  if (score >= 79.5) return 'A'
  if (score >= 64.5) return 'B'
  if (score >= 49.5) return 'C'
  if (score >= 34.5) return 'D'
  return 'E'
}

export default function GradebookViewer() {
  const navigate = useNavigate()
  const [homerooms, setHomerooms] = useState([])
  const [selectedHomeroom, setSelectedHomeroom] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [gradeData, setGradeData] = useState({})
  const [students, setStudents] = useState([])

  // Fetch unique homerooms
  useEffect(() => {
    fetchHomerooms()
  }, [])

  const fetchHomerooms = async () => {
    const { data } = await supabase
      .from('classes')
      .select('name')
      .order('name')
    
    // Extract homeroom from class name (first part before space)
    const homeroomSet = new Set()
    data?.forEach(cls => {
      const homeroom = cls.name?.split(' ')[0]
      if (homeroom) homeroomSet.add(homeroom)
    })
    
    setHomerooms(Array.from(homeroomSet).sort())
    setLoading(false)
  }

  // Fetch classes for selected homeroom
  useEffect(() => {
    if (selectedHomeroom) {
      fetchClasses()
    } else {
      setClasses([])
      setStudents([])
      setGradeData({})
    }
  }, [selectedHomeroom])

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*, users(full_name)')
      .like('name', `${selectedHomeroom}%`)
      .order('name')
    
    setClasses(data || [])
  }

  // Fetch grade data when homeroom and term are selected
  useEffect(() => {
    if (selectedHomeroom && selectedTerm && classes.length > 0) {
      fetchGradeData()
    }
  }, [selectedHomeroom, selectedTerm, classes])

  const fetchGradeData = async () => {
    const classIds = classes.map(c => c.id)
    
    // Fetch students enrolled in any of these classes
    const { data: enrollmentData } = await supabase
      .from('class_students')
      .select('student_id, class_id')
      .in('class_id', classIds)
    
    // Get unique students
    const studentIds = [...new Set(enrollmentData?.map(e => e.student_id) || [])]
    
    if (studentIds.length === 0) {
      setStudents([])
      setGradeData({})
      return
    }
    
    // Fetch student details
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .in('id', studentIds)
      .order('name_eng')
    
    setStudents(studentData || [])
    
    // Fetch participation grades
    const { data: participationData } = await supabase
      .from('participation_grades')
      .select('*')
      .in('class_id', classIds)
      .eq('term', selectedTerm)
      .in('student_id', studentIds)
    
    // Fetch assignments and grades
    const { data: assignmentData } = await supabase
      .from('assignments')
      .select('*')
      .in('class_id', classIds)
      .eq('term', selectedTerm)
    
    const assignmentIds = assignmentData?.map(a => a.id) || []
    let assignmentGradesData = []
    if (assignmentIds.length > 0) {
      const { data: agData } = await supabase
        .from('assignment_grades')
        .select('*')
        .in('assignment_id', assignmentIds)
        .in('student_id', studentIds)
      assignmentGradesData = agData || []
    }
    
    // Fetch progress test grades
    const { data: progressTestData } = await supabase
      .from('progress_test_grades')
      .select('*')
      .in('class_id', classIds)
      .eq('term', selectedTerm)
      .in('student_id', studentIds)
    
    // Organize data by student and class
    const dataByStudent = {}
    students.forEach(student => {
      dataByStudent[student.id] = {}
      classes.forEach(cls => {
        dataByStudent[student.id][cls.id] = {
          class: cls,
          participation: [],
          assignments: [],
          progressTest: [],
        }
      })
    })
    
    // Populate participation grades
    participationData?.forEach(grade => {
      if (dataByStudent[grade.student_id]?.[grade.class_id]) {
        dataByStudent[grade.student_id][grade.class_id].participation.push(grade.score)
      }
    })
    
    // Populate assignment grades
    assignmentGradesData?.forEach(grade => {
      const assignment = assignmentData?.find(a => a.id === grade.assignment_id)
      if (assignment && dataByStudent[grade.student_id]?.[assignment.class_id]) {
        dataByStudent[grade.student_id][assignment.class_id].assignments.push({
          score: grade.score,
          max_points: assignment.max_points,
        })
      }
    })
    
    // Populate progress test grades
    progressTestData?.forEach(grade => {
      if (dataByStudent[grade.student_id]?.[grade.class_id]) {
        dataByStudent[grade.student_id][grade.class_id].progressTest.push(grade.score)
      }
    })
    
    setGradeData(dataByStudent)
  }

  const calculateTotals = (classData) => {
    const participationAvg = avg(classData.participation)
    const assignmentTotal = classData.assignments.reduce((sum, a) => sum + (a.score || 0), 0)
    const assignmentMax = classData.assignments.reduce((sum, a) => sum + (a.max_points || 0), 0)
    const assignmentAvg = assignmentMax > 0 ? (assignmentTotal / assignmentMax) * 100 : null
    const progressTestAvg = avg(classData.progressTest)
    
    // Calculate overall total (weighted: Participation 20%, Assignments 50%, Progress Test 30%)
    const overallParts = []
    if (participationAvg != null) overallParts.push(participationAvg * 0.2)
    if (assignmentAvg != null) overallParts.push(assignmentAvg * 0.5)
    if (progressTestAvg != null) overallParts.push(progressTestAvg * 0.3)
    
    const overallTotal = overallParts.length > 0 ? avg(overallParts) * (overallParts.length > 1 ? 1 : 1) : null
    
    return {
      participation: participationAvg,
      assignment: assignmentAvg,
      progressTest: progressTestAvg,
      overall: overallTotal,
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center text-gray-400 py-20">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/classes')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
        >
          ← Go Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Admin Gradebook Viewer</h2>
        <p className="text-gray-500 text-sm mt-1">
          View collective gradebooks for all subjects in a homeroom class
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Homeroom Class</label>
            <select
              value={selectedHomeroom}
              onChange={(e) => {
                setSelectedHomeroom(e.target.value)
                setSelectedTerm('')
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Homeroom</option>
              {homerooms.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              disabled={!selectedHomeroom}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">Select Term</option>
              {TERMS.map(term => (
                <option key={term.key} value={term.key}>{term.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {selectedHomeroom && selectedTerm && classes.length > 0 && (
        <>
          {/* Class Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {classes.map(cls => {
              const classStudents = students.filter(s => 
                gradeData[s.id]?.[cls.id]
              )
              const totals = classStudents.map(s => calculateTotals(gradeData[s.id][cls.id]))
              const avgOverall = avg(totals.map(t => t.overall).filter(o => o != null))
              
              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                  style={{ borderTopColor: '#1f86c7', borderTopWidth: 3 }}
                >
                  <div className="font-semibold text-gray-900">{cls.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {cls.users?.full_name || 'No teacher assigned'}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {classStudents.length} students
                  </div>
                  <div className="text-lg font-bold text-blue-600 mt-2">
                    {fmt(avgOverall)}%
                  </div>
                  <button
                    onClick={() => navigate(`/class/${cls.id}?term=${selectedTerm}`)}
                    className="mt-3 text-xs text-blue-600 hover:underline"
                  >
                    View Full Gradebook →
                  </button>
                </div>
              )
            })}
          </div>

          {/* Student Grade Table */}
          {students.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Student Grades Overview</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium sticky left-0 bg-gray-50">Student</th>
                      {classes.map(cls => (
                        <th key={cls.id} className="text-center px-4 py-3 text-gray-500 font-medium" colSpan="4">
                          {cls.name}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="sticky left-0 bg-gray-100"></th>
                      {classes.map(() => (
                        <>
                          <th className="text-center px-2 py-2 text-xs text-gray-500 font-medium">Part.</th>
                          <th className="text-center px-2 py-2 text-xs text-gray-500 font-medium">Assign.</th>
                          <th className="text-center px-2 py-2 text-xs text-gray-500 font-medium">Prog.</th>
                          <th className="text-center px-2 py-2 text-xs text-gray-500 font-medium">Overall</th>
                        </>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 sticky left-0 bg-white">
                          <div className="font-medium">
                            <span className="text-gray-900">{student.name_eng || '—'}</span>
                            <span className="text-gray-400 px-1">-</span>
                            <span className="text-blue-700">{student.name_vn || '—'}</span>
                          </div>
                          <div className="text-xs text-gray-400">{student.student_id || '—'}</div>
                        </td>
                        {classes.map(cls => {
                          const classData = gradeData[student.id]?.[cls.id]
                          const totals = classData ? calculateTotals(classData) : null
                          return (
                            <td key={cls.id} className="px-2 py-3 text-center">
                              <div className="text-xs text-gray-600">{fmt(totals?.participation)}</div>
                              <div className="text-xs text-gray-600">{fmt(totals?.assignment)}%</div>
                              <div className="text-xs text-gray-600">{fmt(totals?.progressTest)}</div>
                              <div className={`text-xs font-semibold ${
                                totals?.overall != null 
                                  ? totals.overall >= 80 ? 'text-green-600' 
                                  : totals.overall >= 65 ? 'text-blue-600'
                                  : totals.overall >= 50 ? 'text-amber-600'
                                  : 'text-red-600'
                                  : 'text-gray-300'
                              }`}>
                                {fmt(totals?.overall)}%
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {students.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              No students enrolled in any of these classes yet.
            </div>
          )}
        </>
      )}

      {!selectedHomeroom || !selectedTerm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-sm">
            Select a homeroom and term to view collective gradebooks
          </div>
        </div>
      ) : null}
    </Layout>
  )
}
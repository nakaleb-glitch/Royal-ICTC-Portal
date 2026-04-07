import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import { useAuth } from '../../contexts/AuthContext'
import Papa from 'papaparse'

const LEVELS = ['primary', 'secondary']
const SUBJECTS = ['ESL/GP', 'Mathematics', 'Science', 'VN ESL']

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [edits, setEdits] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('full_name')
    setUsers(data || [])
    setEdits({})
    setLoading(false)
  }

  const handleEdit = (userId, field, value) => {
    setEdits(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value }
    }))
  }

  const hasChanges = Object.keys(edits).length > 0

  const saveAll = async () => {
    setSaving(true)
    const updates = Object.entries(edits)
    let errorCount = 0

    for (const [userId, fields] of updates) {
      const { error } = await supabase
        .from('users')
        .update(fields)
        .eq('id', userId)
      if (error) errorCount++
    }

    if (errorCount > 0) {
      setMessage({ type: 'error', text: `${errorCount} updates failed. Please try again.` })
    } else {
      setMessage({ type: 'success', text: `${updates.length} teachers updated successfully.` })
    }

    setSaving(false)
    fetchUsers()
  }

  const getVal = (user, field) => {
    return edits[user.id]?.[field] ?? user[field] ?? ''
  }

  const deleteUser = async (userId) => {
    const { error } = await supabase.from('users').delete().eq('id', userId)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'User removed.' })
      setConfirmDelete(null)
      fetchUsers()
    }
  }

  const handleCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const teachers = results.data.map(row => ({
          full_name: row['Full Name'] || row['full_name'],
          email: row['Email'] || row['email'],
        }))
        const { data: { session } } = await supabase.auth.getSession()
        const { data, error } = await supabase.functions.invoke('create-teachers', {
          body: { teachers },
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (error) {
          setMessage({ type: 'error', text: 'Import failed: ' + error.message })
        } else {
          const successCount = data.results?.length || 0
          const errorCount = data.errors?.length || 0
          if (errorCount > 0) {
            setMessage({ type: 'error', text: `${successCount} imported, ${errorCount} failed: ${data.errors.map(e => e.email + ': ' + e.error).join(', ')}` })
          } else {
            setMessage({ type: 'success', text: `${successCount} teachers imported successfully with default password royal@123` })
          }
          fetchUsers()
        }
        setImporting(false)
        e.target.value = ''
      }
    })
  }

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="text-gray-500 text-sm mt-1">{users.length} users in the system</p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button onClick={saveAll} disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-300">
              {saving ? 'Saving...' : `Save Changes (${Object.keys(edits).length})`}
            </button>
          )}
          <label className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${importing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {importing ? 'Importing...' : '+ Import Teachers CSV'}
            <input type="file" accept=".csv" className="hidden" onChange={handleCSV} disabled={importing} />
          </label>
        </div>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {confirmDelete && (
        <div className="mb-6 px-4 py-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm font-medium text-red-700 mb-3">Are you sure you want to remove <strong>{confirmDelete.full_name || confirmDelete.email}</strong>?</p>
          <div className="flex gap-2">
            <button onClick={() => deleteUser(confirmDelete.id)} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Yes, remove</button>
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No users yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Level</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => {
                const isEdited = !!edits[user.id]
                return (
                  <tr key={user.id} className={isEdited ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2">
                      <input type="text" value={getVal(user, 'full_name')}
                        onChange={e => handleEdit(user.id, 'full_name', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      {user.id === currentUser?.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{user.email}</td>
                    <td className="px-4 py-2">
                      <select value={getVal(user, 'role')}
                        onChange={e => handleEdit(user.id, 'role', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select value={getVal(user, 'level')}
                        onChange={e => handleEdit(user.id, 'level', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">—</option>
                        {LEVELS.map(l => <option key={l} value={l}>{l === 'primary' ? 'Primary' : 'Secondary'}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select value={getVal(user, 'subject')}
                        onChange={e => handleEdit(user.id, 'subject', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">—</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      {user.id !== currentUser?.id && (
                        <button onClick={() => setConfirmDelete(user)}
                          className="px-3 py-1 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50">
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500 font-medium mb-1">CSV Format:</p>
        <code className="text-xs text-gray-600">Full Name, Email</code>
        <p className="text-xs text-gray-400 mt-1">Default password: royal@123</p>
      </div>
    </Layout>
  )
}
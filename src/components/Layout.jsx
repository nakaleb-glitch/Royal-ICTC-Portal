import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
  ]

  const requiresPasswordChange = !!profile?.must_change_password

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setUpdatingPassword(true)

    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword,
      data: { force_password_change: false },
    })
    if (authError) {
      setPasswordError(authError.message)
      setUpdatingPassword(false)
      return
    }

    const { error: profileError } = await supabase
      .from('users')
      .update({ must_change_password: false })
      .eq('id', user?.id)

    if (profileError) {
      setPasswordError(profileError.message)
      setUpdatingPassword(false)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setUpdatingPassword(false)
    await refreshProfile()
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f9' }}>
      {/* Navbar */}
      <nav style={{ background: '#1a1a1a', borderBottom: '3px solid #d1232a' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Left — Royal School Logo */}
          <div className="flex items-center gap-8">
            <img
              src="/LOGO_ROYAL_SCHOOL_3.png"
              alt="Royal School International"
              className="h-12 w-auto"
            />
            {/* Nav links */}
            <div className="flex gap-6">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-sm font-medium transition-colors"
                  style={{
                    color: location.pathname === item.path ? '#ffc612' : '#ccc',
                    borderBottom: location.pathname === item.path ? '2px solid #ffc612' : '2px solid transparent',
                    paddingBottom: '2px'
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right — Cambridge Logo + user info */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{user?.email}</span>
              <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  background: profile?.role === 'admin' ? '#d1232a' : '#1f86c7',
                  color: '#fff'
                }}>
                {profile?.role}
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs font-medium transition-colors"
                style={{ color: '#999' }}
                onMouseOver={e => e.target.style.color = '#d1232a'}
                onMouseOut={e => e.target.style.color = '#999'}
              >
                Sign out
              </button>
            </div>
            <img
              src="/LOGO_CAMBRIDGE_2.png"
              alt="Cambridge Assessment International Education"
              className="h-10 w-auto"
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {children}
      </main>

      {requiresPasswordChange && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Change Your Password</h3>
            <p className="text-sm text-gray-500 mb-4">Your account must set a new password before continuing.</p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300"
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
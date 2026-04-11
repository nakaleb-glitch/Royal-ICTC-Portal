import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { user, signInWithGoogle, signInWithStaffId } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('teacher')
  const [staffId, setStaffId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [requestingReset, setRequestingReset] = useState(false)
  const [resetMessage, setResetMessage] = useState(null)

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleStaffLogin = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setResetMessage(null)
    const { error: signInError } = await signInWithStaffId(staffId, password)
    if (signInError) {
      setError(signInError.message || 'Could not sign in. Please check credentials.')
    }
    setSubmitting(false)
  }

  const handleForgotPassword = async () => {
    const normalizedStaffId = String(staffId || '').trim()
    if (!normalizedStaffId) {
      setError(mode === 'student' ? 'Please enter your Student ID first.' : 'Please enter your Staff ID first.')
      setResetMessage(null)
      return
    }

    setRequestingReset(true)
    setError('')
    setResetMessage(null)

    const { error: requestError } = await supabase
      .from('password_reset_requests')
      .insert({
        staff_id: normalizedStaffId,
        status: 'new',
      })

    // Keep response generic for security and UX.
    if (requestError && !String(requestError.message || '').toLowerCase().includes('duplicate')) {
      setResetMessage({ type: 'error', text: 'Could not send request right now. Please try again.' })
    } else {
      setResetMessage({
        type: 'success',
        text: 'Password reset request sent. Please wait for an admin to reset your account.',
      })
    }

    setRequestingReset(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a1a' }}>
      <div className="w-full max-w-md">
        {/* Logos */}
        <div className="flex items-center justify-between mb-8 px-2">
          <img src="/LOGO_ROYAL_SCHOOL_3.png" alt="Royal School" className="h-16 w-auto" />
          <img src="/LOGO_CAMBRIDGE_2.png" alt="Cambridge" className="h-12 w-auto" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Red top bar */}
          <div style={{ background: '#d1232a', height: '6px' }} />

          <div className="p-10 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Cambridge Programme Portal</h1>
            <p className="text-gray-400 text-sm mb-8">
              {mode === 'teacher' || mode === 'student'
                ? 'Please use your Staff/Student ID to log in. You will need to reset your password upon first login.'
                : 'Click the button below to login.'}
            </p>

            {mode === 'teacher' || mode === 'student' ? (
              <form onSubmit={handleStaffLogin} className="space-y-3 text-left">
                <input
                  type="text"
                  placeholder="Staff/Student ID"
                  value={staffId}
                  onChange={e => setStaffId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}
                {resetMessage && (
                  <p className={`text-xs ${resetMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {resetMessage.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl px-6 py-3 text-white font-medium transition-colors disabled:bg-gray-300"
                  style={{ backgroundColor: '#1f86c7' }}
                >
                  {submitting ? 'Signing in...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={requestingReset}
                  className="w-full rounded-xl px-6 py-3 border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  {requestingReset ? 'Sending request...' : 'Forgot Password'}
                </button>
              </form>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => { setMode('teacher'); setError(''); setResetMessage(null) }}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors"
                style={{ backgroundColor: mode === 'teacher' || mode === 'student' ? '#166a9b' : '#1f86c7' }}
              >
                Teacher / Student Portal
              </button>
              <button
                onClick={() => { setMode('admin'); setError(''); setResetMessage(null) }}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors"
                style={{ backgroundColor: mode === 'admin' ? '#b61d24' : '#d1232a' }}
              >
                Admin Portal
              </button>
            </div>
          </div>

          {/* Blue bottom bar */}
          <div style={{ background: '#1f86c7', height: '4px' }} />
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Royal School International · Academic Year 2026-2027
        </p>
      </div>
    </div>
  )
}
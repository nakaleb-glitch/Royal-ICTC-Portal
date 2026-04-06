import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user])

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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Gradebook Portal</h1>
            <p className="text-gray-400 text-sm mb-8">Sign in with your school Google account to continue</p>

            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
              Continue with Google
            </button>
          </div>

          {/* Blue bottom bar */}
          <div style={{ background: '#1f86c7', height: '4px' }} />
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Royal School International · Academic Year 2026–27
        </p>
      </div>
    </div>
  )
}
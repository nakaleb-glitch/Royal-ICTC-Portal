import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    ...(profile?.role === 'admin' ? [
      { label: 'Students', path: '/admin/students' },
      { label: 'Classes', path: '/admin/classes' },
      { label: 'Users', path: '/admin/users' },
    ] : []),
  ]

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
    </div>
  )
}
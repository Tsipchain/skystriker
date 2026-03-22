import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/tours', label: 'Tours', icon: '🗺️' },
  { path: '/bookings', label: 'Bookings', icon: '📅' },
  { path: '/reviews', label: 'Reviews', icon: '⭐' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/assistant', label: 'AI Assistant', icon: '🤖' },
  { path: '/profile', label: 'Profile', icon: '👤' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('skystriker_token')
    navigate('/login')
    window.location.reload()
  }

  return (
    <aside className="w-64 bg-sky-900 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">SkyStriker</h1>
        <p className="text-sky-300 text-sm">Tour Guide Platform</p>
      </div>
      <nav className="flex-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive ? 'bg-sky-700 text-white' : 'text-sky-200 hover:bg-sky-800'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-sky-800">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sky-300 hover:text-white hover:bg-sky-800 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

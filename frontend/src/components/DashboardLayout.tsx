import { Link, Outlet, useLocation } from 'react-router-dom'
import RoleSwitcher from './RoleSwitcher'

const SIDEBAR = [
  { to: '/guide', label: 'Overview', icon: '📊' },
  { to: '/guide/profile', label: 'My Profile', icon: '👤' },
  { to: '/guide/verification', label: 'Verification', icon: '✅' },
  { to: '/guide/experiences', label: 'Experiences', icon: '🗺️' },
  { to: '/guide/availability', label: 'Availability', icon: '📅' },
  { to: '/guide/bookings', label: 'Booking Requests', icon: '📩' },
  { to: '/guide/reviews', label: 'Reviews', icon: '⭐' },
  { to: '/guide/settings', label: 'Settings', icon: '⚙️' },
]

export default function DashboardLayout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link to="/" className="font-extrabold text-sky-700 text-lg tracking-tight">
            &#9992; SkyStriker
          </Link>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {SIDEBAR.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === s.to
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{s.icon}</span> {s.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <RoleSwitcher />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20">
          <h1 className="text-lg font-semibold text-gray-900">Guide Dashboard</h1>
          <Link to="/" className="text-sm text-sky-600 hover:underline">Back to site</Link>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

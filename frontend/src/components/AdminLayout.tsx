import { Link, Outlet, useLocation } from 'react-router-dom'

const SIDEBAR = [
  { to: '/admin', label: 'Guides', icon: '👥' },
  { to: '/admin/verifications', label: 'Verifications', icon: '🔍' },
  { to: '/admin/experiences', label: 'Experiences', icon: '🗺️' },
  { to: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  { to: '/admin/audit', label: 'Audit Log', icon: '📋' },
]

export default function AdminLayout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-gray-900 text-gray-300 hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Link to="/" className="font-extrabold text-white text-lg tracking-tight">
            &#9992; SkyStriker <span className="text-xs font-normal text-gray-500 ml-1">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {SIDEBAR.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === s.to
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{s.icon}</span> {s.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
          <Link to="/" className="hover:text-gray-300">Back to site</Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20">
          <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          <Link to="/" className="text-sm text-sky-600 hover:underline">Back to site</Link>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

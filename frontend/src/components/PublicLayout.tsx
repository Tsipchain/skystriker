import { Link, Outlet, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/cities', label: 'Cities' },
  { to: '/guides', label: 'Guides' },
  { to: '/experiences', label: 'Experiences' },
  { to: '/verification', label: 'Verification' },
]

export default function PublicLayout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-sky-700 tracking-tight">
            <span className="text-2xl">&#9992;</span> SkyStriker
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.to
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/guide" className="btn-ghost text-sm">Guide Dashboard</Link>
            <Link to="/admin" className="btn-ghost text-sm">Admin</Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between gap-8 text-sm">
          <div>
            <p className="text-white font-bold text-lg mb-1">SkyStriker Global Guides</p>
            <p>Verified local guides &amp; destination experiences.</p>
            <p className="mt-1">Part of the <span className="text-sky-400">Thronos Chain</span> ecosystem.</p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-white font-semibold mb-2">Explore</p>
              <ul className="space-y-1">
                <li><Link to="/cities" className="hover:text-white">Cities</Link></li>
                <li><Link to="/guides" className="hover:text-white">Guides</Link></li>
                <li><Link to="/experiences" className="hover:text-white">Experiences</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-2">Platform</p>
              <ul className="space-y-1">
                <li><Link to="/verification" className="hover:text-white">Verification</Link></li>
                <li><Link to="/guide" className="hover:text-white">Guide Dashboard</Link></li>
                <li><Link to="/admin" className="hover:text-white">Admin Panel</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

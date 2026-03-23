import { Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function AdminLayout() {
  const { t } = useLang()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  const SIDEBAR = [
    { to: '/admin', label: t('guides'), icon: '👥' },
    { to: '/admin/verifications', label: t('verifications'), icon: '🔍' },
    { to: '/admin/experiences', label: t('experiences'), icon: '🗺️' },
    { to: '/admin/reviews', label: t('reviews'), icon: '⭐' },
    { to: '/admin/bookings', label: t('bookings_payouts'), icon: '💰' },
    { to: '/admin/audit', label: t('audit_log'), icon: '📋' },
  ]

  // Allow access if user is admin OR has legacy admin token
  const hasAdminToken = !!localStorage.getItem('skystriker_admin_token')
  if (!user?.role && user?.role !== 'admin' && !hasAdminToken) {
    return <Navigate to="/auth" />
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-gray-900 text-gray-300 hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Link to="/" className="font-extrabold text-white text-lg tracking-tight">
            &#9992; SkyStriker <span className="text-xs font-normal text-gray-500 ml-1">{t('admin_suffix')}</span>
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
        <div className="p-4 border-t border-gray-800">
          {user && (
            <div className="mb-2">
              <p className="text-xs text-gray-400 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <Link to="/" className="hover:text-gray-300">{t('back_to_site')}</Link>
            {user && (
              <button
                onClick={() => { logout(); window.location.href = '/' }}
                className="hover:text-gray-300"
              >
                {t('logout')}
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20">
          <h1 className="text-lg font-semibold text-gray-900">{t('admin_panel')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/" className="text-sm text-sky-600 hover:underline">{t('back_to_site')}</Link>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import RoleSwitcher from './RoleSwitcher'

export default function DashboardLayout() {
  const { t } = useLang()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  const SIDEBAR = [
    { to: '/guide', label: t('overview'), icon: '📊' },
    { to: '/guide/profile', label: t('my_profile'), icon: '👤' },
    { to: '/guide/verification', label: t('verification'), icon: '✅' },
    { to: '/guide/experiences', label: t('my_experiences'), icon: '🗺️' },
    { to: '/guide/availability', label: t('availability'), icon: '📅' },
    { to: '/guide/bookings', label: t('booking_requests'), icon: '📩' },
    { to: '/guide/reviews', label: t('my_reviews'), icon: '⭐' },
    { to: '/guide/translator', label: t('ai_translator'), icon: '🌐', premium: true },
    { to: '/guide/settings', label: t('settings'), icon: '⚙️' },
  ]

  // If not logged in and no demo guide selected, redirect to auth
  const hasGuideId = !!localStorage.getItem('skystriker_guide_id')
  if (!user && !hasGuideId) {
    return <Navigate to="/auth" />
  }

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
              <span>{s.icon}</span>
              <span className="flex-1">{s.label}</span>
              {'premium' in s && s.premium && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">{t('pro_badge')}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-3">
          {user ? (
            <div className="flex items-center gap-2">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <RoleSwitcher />
          )}
          {user && (
            <button
              onClick={() => { logout(); window.location.href = '/' }}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
            >
              {t('logout')}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20">
          <h1 className="text-lg font-semibold text-gray-900">{t('guide_dashboard')}</h1>
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

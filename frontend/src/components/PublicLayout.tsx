import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

const NAV_KEYS = [
  { to: '/', key: 'home' as const },
  { to: '/cities', key: 'cities' as const },
  { to: '/guides', key: 'guides' as const },
  { to: '/experiences', key: 'experiences' as const },
  { to: '/verification', key: 'verification' as const },
]

export default function PublicLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-sky-700 tracking-tight">
            <span className="text-2xl">&#9992;</span> SkyStriker
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_KEYS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.to
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t(l.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {user ? (
              <>
                {user.role === 'guide' && (
                  <Link to="/guide" className="text-sm font-medium text-sky-600 hover:text-sky-700 px-3 py-2">
                    {t('dashboard')}
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium text-purple-600 hover:text-purple-700 px-3 py-2">
                    {t('admin')}
                  </Link>
                )}
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.full_name.split(' ')[0]}
                  </span>
                  <button
                    onClick={() => { logout(); navigate('/') }}
                    className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                  >
                    {t('logout')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/auth"
                  className="text-sm font-medium bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
                >
                  {t('signup')}
                </Link>
              </>
            )}
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
            <p className="text-white font-bold text-lg mb-1">{t('skystriker_global')}</p>
            <p>{t('footer_tagline')}</p>
            <p className="mt-1">{t('footer_ecosystem', { name: 'Thronos Chain' })}</p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-white font-semibold mb-2">{t('explore')}</p>
              <ul className="space-y-1">
                <li><Link to="/cities" className="hover:text-white">{t('cities')}</Link></li>
                <li><Link to="/guides" className="hover:text-white">{t('guides')}</Link></li>
                <li><Link to="/experiences" className="hover:text-white">{t('experiences')}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-2">{t('platform')}</p>
              <ul className="space-y-1">
                <li><Link to="/verification" className="hover:text-white">{t('verification')}</Link></li>
                <li><Link to="/guide" className="hover:text-white">{t('guide_dashboard')}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-2">{t('legal')}</p>
              <ul className="space-y-1">
                <li><Link to="/terms" className="hover:text-white">{t('terms_of_service')}</Link></li>
                <li><Link to="/privacy" className="hover:text-white">{t('privacy_policy')}</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

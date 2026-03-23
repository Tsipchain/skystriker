import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'
import { useNavigate } from 'react-router-dom'

export default function GuideSettings() {
  const { t } = useLang()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('settings')}</h2>

      <div className="space-y-6">
        {/* Account info */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t('account_info')}</h3>
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xl font-bold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{user.full_name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('role_label')}: <span className="capitalize font-medium">{user.role}</span>
                    {' · '}
                    {t('auth_label')}: <span className="capitalize">{user.auth_provider}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {t('demo_session')}{' '}
              <a href="/auth" className="text-sky-600 hover:underline">{t('sign_up_save')}</a>
            </p>
          )}
        </div>

        {/* Notifications placeholder */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">{t('notifications')}</h3>
          <p className="text-sm text-gray-400">
            {t('notifications_coming')}
          </p>
        </div>

        {/* Payment placeholder */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">{t('payment_settings')}</h3>
          <p className="text-sm text-gray-400">
            {t('payment_coming')}
          </p>
        </div>

        {/* Danger zone */}
        {user && (
          <div className="card p-6 border-red-200">
            <h3 className="font-semibold text-red-600 mb-4">{t('danger_zone')}</h3>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              {t('log_out')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function GuideSettings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      <div className="space-y-6">
        {/* Account info */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
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
                    Role: <span className="capitalize font-medium">{user.role}</span>
                    {' · '}
                    Auth: <span className="capitalize">{user.auth_provider}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              You are using a demo guide session.{' '}
              <a href="/auth" className="text-sky-600 hover:underline">Sign up</a> to save your data.
            </p>
          )}
        </div>

        {/* Notifications placeholder */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Notifications</h3>
          <p className="text-sm text-gray-400">
            Email notification preferences will be available in a future update.
          </p>
        </div>

        {/* Payment placeholder */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Payment Settings</h3>
          <p className="text-sm text-gray-400">
            Payment method configuration and payout settings will be available in a future update.
          </p>
        </div>

        {/* Danger zone */}
        {user && (
          <div className="card p-6 border-red-200">
            <h3 className="font-semibold text-red-600 mb-4">Danger Zone</h3>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

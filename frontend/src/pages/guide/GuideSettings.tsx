import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import type { GuideDetail } from '../../types'

export default function GuideSettings() {
  const { t } = useLang()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [guide, setGuide] = useState<GuideDetail | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [stripeAccountId, setStripeAccountId] = useState('')
  const [cryptoWallet, setCryptoWallet] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [etherfiUrl, setEtherfiUrl] = useState('https://app.ether.fi/card')

  useEffect(() => {
    api.get<GuideDetail>('/api/v1/guide/me').then((data) => {
      setGuide(data)
      setPaymentMethod(data.payment_method || '')
      setStripeAccountId(data.stripe_account_id || '')
      setCryptoWallet(data.crypto_wallet_address || '')
    }).catch(() => {})
    api.get<{ etherfi_referral_url?: string }>('/api/v1/public/config').then((cfg) => {
      if (cfg.etherfi_referral_url) setEtherfiUrl(cfg.etherfi_referral_url)
    }).catch(() => {})
  }, [])

  async function savePayment() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await api.patch<GuideDetail>('/api/v1/guide/me', {
        payment_method: paymentMethod,
        stripe_account_id: stripeAccountId,
        crypto_wallet_address: cryptoWallet,
      })
      setGuide(res)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError(t('failed_update_profile'))
    } finally {
      setSaving(false)
    }
  }

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

        {/* Payment settings */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">{t('payment_settings')}</h3>
          <p className="text-sm text-gray-500 mb-4">{t('payment_desc')}</p>

          {/* Commission info */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-sky-800 font-medium">{t('commission_info')}</p>
            <p className="text-xs text-sky-600 mt-1">{t('commission_detail')}</p>
          </div>

          {/* Payment method selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('payment_method')}</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  paymentMethod === 'stripe'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                Stripe
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('crypto')}
                className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  paymentMethod === 'crypto'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                Crypto Wallet
              </button>
            </div>
          </div>

          {/* Stripe fields */}
          {paymentMethod === 'stripe' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('stripe_account_id')}
              </label>
              <input
                type="text"
                value={stripeAccountId}
                onChange={(e) => setStripeAccountId(e.target.value)}
                placeholder="acct_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <p className="text-xs text-gray-400 mt-1">{t('stripe_help')}</p>
            </div>
          )}

          {/* Crypto fields */}
          {paymentMethod === 'crypto' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crypto_wallet')}
              </label>
              <input
                type="text"
                value={cryptoWallet}
                onChange={(e) => setCryptoWallet(e.target.value)}
                placeholder="0x... / bc1... / T..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <p className="text-xs text-gray-400 mt-1">{t('crypto_help')}</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          {saved && <p className="text-sm text-green-600 mb-3">{t('payment_saved')}</p>}

          <button
            onClick={savePayment}
            disabled={saving || !paymentMethod}
            className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50"
          >
            {saving ? t('saving') : t('save_changes')}
          </button>
        </div>

        {/* Debit Card – Powered by ThronosChain & Ether.fi */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-6 text-white shadow-xl">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-64 h-40 rounded-xl border-2 border-white/30 rotate-6" />
            <div className="absolute top-6 right-8 w-64 h-40 rounded-xl border border-white/20 rotate-3" />
          </div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Card visual */}
            <div className="flex-shrink-0 w-56 h-36 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 flex flex-col justify-between shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div className="w-10 h-7 rounded bg-yellow-300/80" />
                <span className="text-xs font-mono opacity-80">VISA</span>
              </div>
              <div>
                <div className="text-xs font-mono tracking-widest opacity-70 mb-1">**** **** **** ****</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider opacity-60">{t('your_name')}</span>
                  <span className="text-[10px] opacity-60">XX/XX</span>
                </div>
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold mb-1">{t('get_debit_card')}</h3>
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                {t('debit_card_desc')}
              </p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">Powered by</span>
                <span className="text-sm font-bold tracking-tight">ThronosChain</span>
                <span className="text-gray-500">&</span>
                <span className="text-sm font-bold tracking-tight text-indigo-300">Ether.fi</span>
              </div>
              <a
                href={etherfiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                {t('get_your_card')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Notifications placeholder */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-2">{t('notifications')}</h3>
          <p className="text-sm text-gray-400">
            {t('notifications_coming')}
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

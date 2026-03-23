import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

export default function VerificationExplainer() {
  const { t } = useLang()

  const STEPS = [
    { number: '01', title: t('verify_step1_title'), description: t('verify_step1_desc') },
    { number: '02', title: t('verify_step2_title'), description: t('verify_step2_desc') },
    { number: '03', title: t('verify_step3_title'), description: t('verify_step3_desc') },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          {t('verify_how_title')}
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          {t('verify_how_desc')}{' '}
          <span className="text-sky-600 font-semibold">Thronos Chain VerifyID</span>.{' '}
          {t('verify_how_confidence')}
        </p>
      </div>

      <div className="space-y-8 mb-16">
        {STEPS.map((step) => (
          <div key={step.number} className="card p-6 flex gap-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-sky-100 text-sky-700 font-bold text-xl flex items-center justify-center">
              {step.number}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-sky-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-sky-900 mb-2">{t('verify_ready_title')}</h2>
        <p className="text-sky-700 mb-6">
          {t('verify_ready_desc')}
        </p>
        <Link to="/guide" className="inline-block bg-sky-600 text-white font-semibold text-lg px-8 py-3 rounded-lg hover:bg-sky-700 transition-colors">
          {t('verify_open_dashboard')}
        </Link>
      </div>
    </div>
  )
}

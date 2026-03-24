import { useLang } from '../context/LanguageContext'

export default function TermsOfService() {
  const { t } = useLang()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{t('terms_title')}</h1>
      <p className="text-sm text-gray-400 mb-8">{t('terms_last_updated')}: 2026-03-24</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        {/* 1. Acceptance */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('terms_section_acceptance')}</h2>
          <p>{t('terms_acceptance_text')}</p>
        </section>

        {/* 2. Service Description */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('terms_section_service')}</h2>
          <p>{t('terms_service_text')}</p>
        </section>

        {/* 3. User Accounts */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('terms_section_accounts')}</h2>
          <p>{t('terms_accounts_text')}</p>
        </section>

        {/* 4. Guide Obligations */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('terms_section_guides')}</h2>
          <p>{t('terms_guides_text')}</p>
        </section>

        {/* 5. Bookings & Payments */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('terms_section_bookings')}</h2>
          <p>{t('terms_bookings_text')}</p>
        </section>

        {/* 6. Intellectual Property */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('terms_section_ip')}</h2>
          <p>{t('terms_ip_text')}</p>
        </section>

        {/* 7. Limitation of Liability */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('terms_section_liability')}</h2>
          <p>{t('terms_liability_text')}</p>
        </section>

        {/* 8. Termination */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('terms_section_termination')}</h2>
          <p>{t('terms_termination_text')}</p>
        </section>

        {/* 9. Governing Law */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('terms_section_law')}</h2>
          <p>{t('terms_law_text')}</p>
        </section>

        {/* 10. Contact */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('terms_section_contact')}</h2>
          <p>{t('terms_contact_text')}</p>
        </section>
      </div>
    </div>
  )
}

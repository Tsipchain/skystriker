import { useLang } from '../context/LanguageContext'

export default function PrivacyPolicy() {
  const { t } = useLang()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{t('privacy_title')}</h1>
      <p className="text-sm text-gray-400 mb-8">{t('terms_last_updated')}: 2026-03-24</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        {/* 1. Introduction */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('privacy_section_intro')}</h2>
          <p>{t('privacy_intro_text')}</p>
        </section>

        {/* 2. Data We Collect */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('privacy_section_collect')}</h2>
          <p>{t('privacy_collect_text')}</p>
        </section>

        {/* 3. How We Use Data */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('privacy_section_use')}</h2>
          <p>{t('privacy_use_text')}</p>
        </section>

        {/* 4. Legal Basis (GDPR) */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('privacy_section_legal_basis')}</h2>
          <p>{t('privacy_legal_basis_text')}</p>
        </section>

        {/* 5. Data Sharing */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('privacy_section_sharing')}</h2>
          <p>{t('privacy_sharing_text')}</p>
        </section>

        {/* 6. Data Retention */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('privacy_section_retention')}</h2>
          <p>{t('privacy_retention_text')}</p>
        </section>

        {/* 7. Your Rights (GDPR) */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('privacy_section_rights')}</h2>
          <p>{t('privacy_rights_text')}</p>
        </section>

        {/* 8. Cookies */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('privacy_section_cookies')}</h2>
          <p>{t('privacy_cookies_text')}</p>
        </section>

        {/* 9. International Transfers */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('privacy_section_transfers')}</h2>
          <p>{t('privacy_transfers_text')}</p>
        </section>

        {/* 10. Contact DPO */}
        <section>
          <h2 className="text-lg font-bold text-gray-900">{t('privacy_section_dpo')}</h2>
          <p>{t('privacy_dpo_text')}</p>
        </section>
      </div>
    </div>
  )
}

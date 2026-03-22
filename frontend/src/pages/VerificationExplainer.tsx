import { Link } from 'react-router-dom'

const STEPS = [
  {
    number: '01',
    title: 'Submit ID',
    description:
      'Upload a government-issued photo ID through the secure SkyStriker Guide Dashboard. Your documents are encrypted end-to-end and never stored on our servers after verification.',
  },
  {
    number: '02',
    title: 'Review by Thronos Chain',
    description:
      'Your identity is verified through Thronos Chain VerifyID, our trusted decentralised verification partner. The review checks document authenticity and matches your profile information.',
  },
  {
    number: '03',
    title: 'Verified Badge',
    description:
      'Once approved, your profile displays a green "Verified" badge visible to all travellers. This badge signals that you have been identity-checked, building trust and boosting your bookings.',
  },
]

export default function VerificationExplainer() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          How VerifyID Verification Works
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Every guide on SkyStriker goes through our verification process
          powered by <span className="text-sky-600 font-semibold">Thronos Chain VerifyID</span>.
          This ensures travellers can book with complete confidence.
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
        <h2 className="text-2xl font-bold text-sky-900 mb-2">Ready to become a verified guide?</h2>
        <p className="text-sky-700 mb-6">
          Join hundreds of verified locals sharing authentic experiences with travellers worldwide.
        </p>
        <Link to="/guide" className="inline-block bg-sky-600 text-white font-semibold text-lg px-8 py-3 rounded-lg hover:bg-sky-700 transition-colors">
          Open Guide Dashboard
        </Link>
      </div>
    </div>
  )
}

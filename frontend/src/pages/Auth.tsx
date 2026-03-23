import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'guest' | 'guide'>('guest')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, signup, googleLogin, user } = useAuth()
  const navigate = useNavigate()

  // If already logged in, redirect
  if (user) {
    navigate(user.role === 'guide' ? '/guide' : '/')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (!fullName.trim()) {
          setError('Full name is required')
          setSubmitting(false)
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setSubmitting(false)
          return
        }
        await signup(email, password, fullName, role)
      }
      navigate(role === 'guide' ? '/guide' : '/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleClick() {
    setError('')
    // Try loading Google Identity Services
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
    if (!clientId) {
      setError('Google Sign-In is not yet configured. Please use email login.')
      return
    }

    // Dynamically load GSI script
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script')
      script.id = 'google-gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = () => renderGoogleButton(clientId)
      document.head.appendChild(script)
    } else {
      renderGoogleButton(clientId)
    }
  }

  function renderGoogleButton(clientId: string) {
    const g = (window as unknown as Record<string, unknown>).google as Record<string, unknown> | undefined
    if (!g) {
      setError('Failed to load Google Sign-In')
      return
    }
    const accounts = g.accounts as Record<string, unknown>
    const id = accounts.id as {
      initialize: (config: Record<string, unknown>) => void
      prompt: () => void
    }
    id.initialize({
      client_id: clientId,
      callback: async (response: { credential: string }) => {
        setSubmitting(true)
        try {
          await googleLogin(response.credential, role)
          navigate(role === 'guide' ? '/guide' : '/')
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Google authentication failed')
        } finally {
          setSubmitting(false)
        }
      },
    })
    id.prompt()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold text-sky-700">
            <span className="text-3xl">&#9992;</span> SkyStriker
          </Link>
          <p className="text-gray-500 mt-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Tab toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Role selector (for signup) */}
          {mode === 'signup' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('guest')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    role === 'guest'
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-lg mb-1">&#127758;</span>
                  Book Experiences
                </button>
                <button
                  type="button"
                  onClick={() => setRole('guide')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    role === 'guide'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-lg mb-1">&#127915;</span>
                  Become a Guide
                </button>
              </div>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-sky-600 text-white font-semibold py-2.5 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Log In'
                  : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/" className="text-sky-600 hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import api from '../api/client'

interface Props {
  onLogin: () => void
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isRegister ? '/api/v1/auth/register' : '/api/v1/auth/login'
      const data = isRegister ? { email, name } : { email }
      const res = await api.post(endpoint, data)
      localStorage.setItem('skystriker_token', res.data.access_token)
      onLogin()
      window.location.href = '/'
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sky-900">SkyStriker</h1>
          <p className="text-gray-500">Tour Guide Platform</p>
          <p className="text-xs text-gray-400 mt-1">Part of the Thronos Ecosystem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your full name"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="guide@example.com"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Loading...' : isRegister ? 'Register as Guide' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-sky-600 hover:text-sky-700"
          >
            {isRegister ? 'Already have an account? Sign in' : 'New guide? Register here'}
          </button>
        </div>
      </div>
    </div>
  )
}
